
// File: controllers/productController.js
const db = require('../config/database');

exports.getAllProducts = (req, res) => {
    const cat = req.query.category;
    let sql = "SELECT * FROM products";
    let params = [];
    if (cat && cat !== 'All Products') {
        sql += " WHERE category = ?";
        params.push(cat);
    }
    db.all(sql, params, (err, rows) => res.json(rows || []));
};

exports.createProduct = (req, res) => {
    const { name, category, price, stock, description, imageUrl } = req.body;
    db.run("INSERT INTO products (name, category, price, stock, description, imageUrl) VALUES (?, ?, ?, ?, ?, ?)",
        [name, category, price, stock, description, imageUrl],
        function(err) { res.json({ success: !err }); }
    );
};

exports.updateProduct = (req, res) => {
    const { name, category, price, stock, description, imageUrl } = req.body;
    db.run(`UPDATE products SET name=?, category=?, price=?, stock=?, description=?, imageUrl=? WHERE id=?`,
        [name, category, price, stock, description, imageUrl, req.params.id],
        function(err) { res.json({ success: !err }); }
    );
};

exports.deleteProduct = (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], (err) => res.json({ success: !err }));
};

exports.getCategories = (req, res) => {
    db.all("SELECT * FROM categories", [], (err, rows) => res.json(rows));
};

exports.addCategory = (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO categories (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(400).json({ success: false });
        res.json({ success: true, id: this.lastID, name });
    });
};

// ADD THIS NEW FUNCTION:
exports.restockProduct = (req, res) => {
    const { quantity } = req.body;
    const { id } = req.params;

    if (!quantity || isNaN(quantity)) {
        return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, [quantity, id], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Stock updated successfully" });
    });
};