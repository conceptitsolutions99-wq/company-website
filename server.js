require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { dbQuery, dbQueryOne } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Every enquiry from the site lands in this inbox.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'conceptitsolutions99@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Absolute base for canonical links, social cards and the sitemap.
const SITE_URL = (process.env.SITE_URL || 'https://company-website-n9ba.vercel.app').replace(/\/$/, '');

// Abuse limits for the enquiry endpoint.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

// Behind Vercel's proxy req.ip is the forwarded client address.
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Every view builds its canonical/OG URLs from this.
app.use((req, res, next) => {
    res.locals.siteUrl = SITE_URL;
    next();
});

// ========================================
// Email
// ========================================
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_USER || !SMTP_PASS) return null;

    const port = Number(SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
        host: SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    return transporter;
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[char]));

// ========================================
// Enquiries
// ========================================
// Per-IP limit held in memory. Serverless instances are short-lived, so this is
// a speed bump for scripted abuse rather than a hard quota.
const recentHits = new Map();

function rateLimited(ip) {
    const now = Date.now();
    const hits = (recentHits.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
    hits.push(now);
    recentHits.set(ip, hits);

    // Keep the map from growing without bound in a long-lived process.
    if (recentHits.size > 5000) {
        for (const [key, times] of recentHits) {
            if (times[times.length - 1] < now - RATE_WINDOW_MS) recentHits.delete(key);
        }
    }

    return hits.length > RATE_MAX;
}

async function storeEnquiry(enquiry) {
    try {
        const rows = await dbQuery(
            `INSERT INTO enquiries (kind, name, email, phone, service, budget, timing, message, ip, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                enquiry.kind, enquiry.name, enquiry.email, enquiry.phone, enquiry.service,
                enquiry.budget, enquiry.timing, enquiry.message, enquiry.ip, enquiry.userAgent
            ]
        );
        return rows[0] ? rows[0].id : null;
    } catch (err) {
        console.error('[enquiry] could not store:', err.message);
        return null;
    }
}

app.post('/api/enquiry', async (req, res) => {
    const { name, email, phone, type, service, budget, timing, message, website } = req.body || {};

    // Honeypot: hidden in both forms, so a value here can only come from a script.
    if (website) {
        return res.json({ success: true });
    }

    if (rateLimited(req.ip)) {
        return res.status(429).json({
            error: `Too many messages from this connection. Please try again later or email ${CONTACT_EMAIL}.`
        });
    }

    if (!name || !EMAIL_RE.test(String(email || ''))) {
        return res.status(400).json({ error: 'A name and a valid email address are required.' });
    }

    // Persist before emailing: a mail problem must never lose the lead.
    const enquiryId = await storeEnquiry({
        kind: type === 'service' ? 'service' : 'brief',
        name,
        email,
        phone: phone || null,
        service: service || null,
        budget: budget || null,
        timing: timing || null,
        message: message || null,
        ip: req.ip,
        userAgent: (req.get('user-agent') || '').slice(0, 300)
    });

    const mailer = getTransporter();
    if (!mailer) {
        console.warn(
            `[email] SMTP_USER / SMTP_PASS are not set — enquiry ${enquiryId || '(not stored)'} was not emailed.`
        );
        return res.status(503).json({
            error: `Email is not configured yet. Please write to ${CONTACT_EMAIL}.`
        });
    }

    const subject = type === 'service'
        ? `Service request — ${service || 'General'}`
        : `New project enquiry — ${name}`;

    const rows = [
        ['Name', name],
        ['Email', email],
        ['Phone', phone || '—'],
        ['Needs', service || '—'],
        ['Budget', budget || '—'],
        ['Timing', timing || '—'],
        ['Details', message || '—']
    ];

    const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
    const html = rows
        .map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`)
        .join('');

    try {
        await mailer.sendMail({
            from: `"True Concept website" <${process.env.SMTP_USER}>`,
            to: CONTACT_EMAIL,
            replyTo: email,
            subject,
            text,
            html: `<h2>${escapeHtml(subject)}</h2><table cellpadding="6">${html}</table>`
        });
        if (enquiryId) {
            dbQuery('UPDATE enquiries SET email_sent = true WHERE id = ?', [enquiryId])
                .catch((err) => console.error('[enquiry] could not flag as sent:', err.message));
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[email] send failed:', err.message);

        // The row is already stored, so the visitor's submission still succeeds.
        if (enquiryId) {
            return res.json({ success: true, stored: true, emailed: false });
        }

        res.status(502).json({ error: `We could not send your message. Please write to ${CONTACT_EMAIL}.` });
    }
});

// ========================================
// Crawlers
// ========================================
app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
    // Only the two public pages: /request/:id is a form, not an indexable page.
    const pages = [
        { path: '/', changefreq: 'weekly', priority: '1.0' },
        { path: '/services', changefreq: 'monthly', priority: '0.8' }
    ];

    const urls = pages
        .map((page) => `  <url><loc>${SITE_URL}${page.path}</loc>` +
            `<changefreq>${page.changefreq}</changefreq>` +
            `<priority>${page.priority}</priority></url>`)
        .join('\n');

    res.type('application/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    );
});

// ========================================
// Pages
// ========================================
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/services', async (req, res) => {
    try {
        const catalogue = await dbQuery('SELECT * FROM services ORDER BY id');
        res.render('services', { catalogue, contactEmail: CONTACT_EMAIL });
    } catch (err) {
        console.error(err);
        // The view falls back to the six disciplines when there is no catalogue.
        res.render('services', { catalogue: [], contactEmail: CONTACT_EMAIL });
    }
});

app.get('/request/:id', async (req, res) => {
    let service = null;
    try {
        service = await dbQueryOne('SELECT * FROM services WHERE id = ?', [req.params.id]);
    } catch (err) {
        console.error(err);
    }

    if (!service) {
        return res.status(404).render('error', { error: 'Service not found' });
    }

    res.render('request', { service, contactEmail: CONTACT_EMAIL });
});

// ========================================
// Error Handling
// ========================================
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('error', { error: 'Something went wrong' });
});

app.use((req, res) => {
    res.status(404).render('error', { error: 'Page not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 True Concept Server running at http://localhost:${PORT}`);
    if (!getTransporter()) {
        console.warn('[email] SMTP_USER / SMTP_PASS are not set — enquiry emails will fail.');
    }
});

module.exports = app;
