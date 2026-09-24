const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'true_concept.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Services table
        db.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                price REAL NOT NULL,
                image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Requests table
        db.run(`
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                details TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (service_id) REFERENCES services(id)
            )
        `);

        // Seed initial admin user if not exists
        db.get("SELECT * FROM users WHERE email = 'admin@trueconcept.com'", (err, row) => {
            if (!row) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                    ['Admin', 'admin@trueconcept.com', hashedPassword, 'admin']
                );
            }
        });

        // Seed initial services if not exists
        db.get("SELECT COUNT(*) as count FROM services", (err, row) => {
            if (row && row.count === 0) {
                const services = [
                    {
                        name: 'Custom Software Development',
                        description: 'Tailored enterprise software solutions built from the ground up to address your specific business requirements and workflows. We create scalable, maintainable code that grows with your business.',
                        price: 150000
                    },
                    {
                        name: 'Mobile App Development',
                        description: 'Native and cross-platform mobile applications for iOS and Android. Deliver exceptional user experiences that keep your customers engaged and coming back.',
                        price: 90000
                    },
                    {
                        name: 'Web Development',
                        description: 'Modern, responsive websites built with the latest technologies. From simple marketing sites to complex web applications, we create digital experiences that convert.',
                        price: 75000
                    },
                    {
                        name: 'CCTV Installation',
                        description: 'Professional surveillance system setup and configuration. Secure your premises with state-of-the-art CCTV technology and 24/7 monitoring capabilities.',
                        price: 45000
                    },
                    {
                        name: 'Network Solutions',
                        description: 'Network infrastructure design, setup, and optimization. Ensure reliable, secure, and efficient connectivity for your entire organization.',
                        price: 120000
                    }
                ];

                services.forEach(service => {
                    db.run(
                        "INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
                        [service.name, service.description, service.price]
                    );
                });
            }
        });
    });
}

// Database query helpers
const dbQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbQueryOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

// Initialize database on require
initializeDatabase();

module.exports = {
    db,
    dbQuery,
    dbQueryOne,
    dbRun
};