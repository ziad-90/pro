const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Connect to database (creates file in main project folder)
const dbPath = path.resolve(__dirname, '../pharmacy.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the pharmacy database.');
});

db.serialize(() => {
    // Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user', phone TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)`);
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, price REAL, stock INTEGER, description TEXT, imageUrl TEXT)`);

    // Updated orders table to include 'gov'
    db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, total REAL, status TEXT, payment_method TEXT, items TEXT, address TEXT, gov TEXT, phone TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    db.run(`CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, card_last4 TEXT, card_token TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    // Migration helper: Try to add columns if they don't exist (for existing databases)
    // We ignore errors which happen if columns already exist
    db.run("ALTER TABLE orders ADD COLUMN gov TEXT", () => {});
    db.run("ALTER TABLE orders ADD COLUMN phone TEXT", () => {});
    db.run("ALTER TABLE users ADD COLUMN phone TEXT", () => {});

    // Seed Admin Account
    db.get("SELECT * FROM users WHERE role = 'admin'", (err, row) => {
        if (!row) {
            const adminPass = bcrypt.hashSync('Admin123!', 10);
            db.run(`INSERT INTO users (name, email, password, role) VALUES ('System Admin', 'admin@pharma.com', ?, 'admin')`, [adminPass]);
            console.log("Admin account created.");
        }
    });

    // Seed Categories
    ['Painkillers', 'Vitamins', 'First Aid', 'Skincare'].forEach(cat => {
        db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [cat]);
    });
});

module.exports = db;