require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { dbQuery, dbQueryOne } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Every enquiry from the site lands in this inbox.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'conceptitsolutions99@gmail.com';

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
// API Routes
// ========================================
app.get('/api/services', async (req, res) => {
    try {
        const services = await dbQuery('SELECT * FROM services ORDER BY created_at DESC');
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

app.get('/api/services/:id', async (req, res) => {
    try {
        const service = await dbQueryOne('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

// Public enquiry endpoint: nothing is stored, the details are emailed to the company inbox.
app.post('/api/enquiry', async (req, res) => {
    const { name, email, phone, type, service, budget, timing, message } = req.body || {};

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const mailer = getTransporter();
    if (!mailer) {
        console.warn('[email] SMTP_USER / SMTP_PASS are not set — enquiry was not sent.');
        return res.status(503).json({
            error: `Email is not configured yet. Please write to ${CONTACT_EMAIL}.`,
            contactEmail: CONTACT_EMAIL
        });
    }

    const isServiceRequest = type === 'service';
    const subject = isServiceRequest
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
    const html = `<h2>${escapeHtml(subject)}</h2><table cellpadding="6">${rows
        .map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`)
        .join('')}</table>`;

    try {
        await mailer.sendMail({
            from: `"True Concept website" <${process.env.SMTP_USER}>`,
            to: CONTACT_EMAIL,
            replyTo: email,
            subject,
            text,
            html
        });
        res.json({ success: true });
    } catch (err) {
        console.error('[email] send failed:', err.message);
        res.status(502).json({
            error: `We could not send your message. Please write to ${CONTACT_EMAIL}.`,
            contactEmail: CONTACT_EMAIL
        });
    }
});

// ========================================
// Pages
// ========================================
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/services', async (req, res) => {
    try {
        const services = await dbQuery('SELECT * FROM services');
        res.render('services', { services, contactEmail: CONTACT_EMAIL });
    } catch (err) {
        console.error(err);
        res.render('services', { services: [], contactEmail: CONTACT_EMAIL, error: 'Failed to load services' });
    }
});

app.get('/request/:id', async (req, res) => {
    try {
        const service = await dbQueryOne('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (!service) {
            return res.status(404).render('error', { error: 'Service not found' });
        }
        res.render('request', { service, contactEmail: CONTACT_EMAIL });
    } catch (err) {
        console.error(err);
        res.status(404).render('error', { error: 'Service not found' });
    }
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
