const express = require('express');
const path = require('path');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { dbQuery, dbQueryOne, dbRun } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global User Extraction Middleware (Optional Auth)
app.use((req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            res.locals.user = decoded;
        } catch (err) {
            req.user = null;
            res.locals.user = null;
            res.clearCookie('token');
        }
    } else {
        req.user = null;
        res.locals.user = null;
    }
    next();
});

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/images'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Email configuration (for development, just log to console)
const sendEmail = async (to, subject, text, html) => {
    console.log(`\n📧 Email would be sent:\nTo: ${to}\nSubject: ${subject}\nMessage: ${text}\n`);
};

// ========================================
// Middleware: Verify JWT Token
// ========================================
const verifyToken = (req, res, next) => {
    if (req.user) {
        return next();
    }

    const isApi = req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/');

    if (isApi) {
        return res.status(401).json({ error: 'Please login first' });
    }

    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
};

// ========================================
// Middleware: Verify Admin Role
// ========================================
const verifyAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        const isApi = req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/');
        if (isApi) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        return res.status(403).render('error', { error: 'Admin access required' });
    }
    next();
};

// ========================================
// API Routes: Authentication
// ========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const existingUser = await dbQueryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = bcryptjs.hashSync(password, 10);
        const result = await dbRun('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'customer']
        );

        const token = jwt.sign({ id: result.id, email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true, token, redirect: '/dashboard' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await dbQueryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || !bcryptjs.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true, token, redirect: user.role === 'admin' ? '/admin/dashboard' : '/dashboard' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// ========================================
// API Routes: Services
// ========================================
app.get('/api/services', async (req, res) => {
    try {
        const services = await dbQuery('SELECT * FROM services ORDER BY created_at DESC');
        res.json(services);
    } catch (err) {
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
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

app.post('/api/services', verifyToken, verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!name || !description || !price) {
            return res.status(400).json({ error: 'Name, description, and price required' });
        }

        const result = await dbRun(
            'INSERT INTO services (name, description, price, image) VALUES (?, ?, ?, ?)',
            [name, description, parseFloat(price), image]
        );

        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

app.put('/api/services/:id', verifyToken, verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const image = req.file ? req.file.filename : req.body.existingImage;

        if (!name || !description || !price) {
            return res.status(400).json({ error: 'Name, description, and price required' });
        }

        await dbRun(
            'UPDATE services SET name = ?, description = ?, price = ?, image = ? WHERE id = ?',
            [name, description, parseFloat(price), image, req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

app.delete('/api/services/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM services WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// ========================================
// API Routes: Requests
// ========================================
app.post('/api/requests', verifyToken, async (req, res) => {
    try {
        const { service_id, details } = req.body;

        if (!service_id || !details) {
            return res.status(400).json({ error: 'Service and details required' });
        }

        const service = await dbQueryOne('SELECT * FROM services WHERE id = ?', [service_id]);
        const user = await dbQueryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

        const result = await dbRun(
            'INSERT INTO requests (user_id, service_id, details, status) VALUES (?, ?, ?, ?)',
            [req.user.id, service_id, details, 'pending']
        );

        // Send email notification to admin
        await sendEmail(
            'admin@trueconcept.com',
            'New Service Request',
            `New request from ${user.name} for ${service.name}.\nDetails: ${details}`,
            `<h2>New Service Request</h2><p><strong>From:</strong> ${user.name} (${user.email})</p><p><strong>Service:</strong> ${service.name}</p><p><strong>Details:</strong> ${details}</p>`
        );

        res.json({ success: true, id: result.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

app.get('/api/requests', verifyToken, async (req, res) => {
    try {
        let requests;
        if (req.user.role === 'admin') {
            requests = await dbQuery(`
                SELECT r.*, u.name as user_name, u.email as user_email, s.name as service_name
                FROM requests r
                JOIN users u ON r.user_id = u.id
                JOIN services s ON r.service_id = s.id
                ORDER BY r.created_at DESC
            `);
        } else {
            requests = await dbQuery(`
                SELECT r.*, s.name as service_name, s.price
                FROM requests r
                JOIN services s ON r.service_id = s.id
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
            `, [req.user.id]);
        }
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

app.put('/api/requests/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const request = await dbQueryOne(`
            SELECT r.*, u.email as user_email, u.name as user_name, s.name as service_name
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            WHERE r.id = ?
        `, [req.params.id]);

        await dbRun('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id]);

        // Send email to customer
        const statusMessage = status === 'approved' ? 'approved' : 'rejected';
        await sendEmail(
            request.user_email,
            `Service Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
            `Your request for ${request.service_name} has been ${statusMessage}.`,
            `<h2>Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}</h2><p>Your service request for <strong>${request.service_name}</strong> has been <strong>${statusMessage}</strong>.</p><p>We'll contact you soon with more details.</p>`
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// ========================================
// Page Routes
// ========================================
app.get('/', (req, res) => {
    res.render('index', { user: req.user || null });
});

app.get('/login', (req, res) => {
    if (req.user) {
        const redirectUrl = req.query.redirect || (req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        return res.redirect(redirectUrl);
    }
    res.render('login', { redirect: req.query.redirect || null, error: null });
});

app.get('/register', (req, res) => {
    if (req.user) {
        const redirectUrl = req.query.redirect || (req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        return res.redirect(redirectUrl);
    }
    res.render('register', { redirect: req.query.redirect || null, error: null });
});

app.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const requests = await dbQuery(`
            SELECT r.*, s.name as service_name, s.price
            FROM requests r
            JOIN services s ON r.service_id = s.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);

        res.render('dashboard', { user: req.user, requests });
    } catch (err) {
        res.render('dashboard', { user: req.user, error: 'Failed to load requests', requests: [] });
    }
});

app.get('/services', async (req, res) => {
    try {
        const services = await dbQuery('SELECT * FROM services');
        res.render('services', { services, user: req.user || null });
    } catch (err) {
        res.render('services', { services: [], error: 'Failed to load services', user: req.user || null });
    }
});

app.get('/request/:id', verifyToken, async (req, res) => {
    try {
        const service = await dbQueryOne('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (!service) {
            return res.status(404).render('error', { error: 'Service not found' });
        }
        res.render('request', { service, user: req.user });
    } catch (err) {
        res.status(404).render('error', { error: 'Service not found' });
    }
});

// ========================================
// Admin Routes
// ========================================
app.get('/admin/login', (req, res) => {
    if (req.user && req.user.role === 'admin') {
        const redirectUrl = req.query.redirect || '/admin/dashboard';
        return res.redirect(redirectUrl);
    }
    res.render('admin/login', { redirect: req.query.redirect || null, error: null });
});

app.get('/admin/dashboard', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const services = await dbQuery('SELECT * FROM services');
        const requests = await dbQuery(`
            SELECT r.*, u.name as user_name, u.email as user_email, s.name as service_name
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
        `);

        res.render('admin/dashboard', { user: req.user, services, requests });
    } catch (err) {
        res.render('admin/dashboard', { user: req.user, error: 'Failed to load data', services: [], requests: [] });
    }
});

app.get('/admin/services', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const services = await dbQuery('SELECT * FROM services ORDER BY created_at DESC');
        res.render('admin/services', { user: req.user, services });
    } catch (err) {
        res.render('admin/services', { user: req.user, error: 'Failed to load services', services: [] });
    }
});

app.get('/admin/services/add', verifyToken, verifyAdmin, (req, res) => {
    res.render('admin/add-service', { user: req.user });
});

app.get('/admin/services/:id/edit', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const service = await dbQueryOne('SELECT * FROM services WHERE id = ?', [req.params.id]);
        res.render('admin/edit-service', { user: req.user, service });
    } catch (err) {
        res.status(404).render('error', { error: 'Service not found' });
    }
});

app.get('/admin/requests', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const requests = await dbQuery(`
            SELECT r.*, u.name as user_name, u.email as user_email, s.name as service_name
            FROM requests r
            JOIN users u ON r.user_id = u.id
            JOIN services s ON r.service_id = s.id
            ORDER BY r.created_at DESC
        `);

        res.render('admin/requests', { user: req.user, requests });
    } catch (err) {
        res.render('admin/requests', { user: req.user, error: 'Failed to load requests', requests: [] });
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

// ========================================
// Start Server
// ========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 True Concept Server running at:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://192.168.1.5:${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin/login`);
    console.log(`\n📝 Default Admin Credentials:`);
    console.log(`   Email: admin@trueconcept.com`);
    console.log(`   Password: admin123\n`);
});

module.exports = app;