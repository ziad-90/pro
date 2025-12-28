// File: controllers/authController.js
const bcrypt = require('bcryptjs');
const db = require('../config/database');

exports.register = (req, res) => {
    const { name, email, password } = req.body;

    // Regex: At least 8 chars, 1 uppercase, 1 digit, 1 symbol
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!regex.test(password)) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters, include an uppercase letter, a number, and a symbol."
        });
    }

    const hash = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hash], function(err) {
        if (err) return res.status(400).json({ success: false, message: "Email already exists." });
        res.json({ success: true });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        res.json({ success: true, token: user.id, user: { id: user.id, name: user.name, role: user.role } });
    });
};

exports.adminLogin = (req, res) => {
    const { "admin-id": adminId, password } = req.body;
    db.get(`SELECT * FROM users WHERE (email = ? OR name = ?) AND role = 'admin'`, [adminId, adminId], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ success: false });
        }
        res.json({ success: true, token: user.id, user: { id: user.id, role: 'admin' } });
    });
};