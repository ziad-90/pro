const db = require('../config/database');

// Helper to get user from token
const getUser = (req) => {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const token = auth.split(' ')[1];
    return { id: token };
};

exports.createOrder = (req, res) => {
    const user = getUser(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Destructure new 'gov' field
    const { cart, paymentMethod, cardInfo, saveCard, address, gov, phone } = req.body;

    if (!cart || cart.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 1. Process Stock Decrement
    const updateStockPromises = cart.map(item => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT stock FROM products WHERE id = ?`, [item.id], (err, row) => {
                if (err) return reject(err);
                if (!row || row.stock < item.quantity) {
                    return reject(new Error(`Not enough stock for item ID: ${item.id}`));
                }
                db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    });

    Promise.all(updateStockPromises)
        .then(() => {
            // 2. Save Card if requested
            if (paymentMethod === 'credit' && saveCard && cardInfo) {
                const last4 = cardInfo.cardNumber.slice(-4);
                db.run(`INSERT INTO cards (user_id, card_last4, card_token) VALUES (?, ?, ?)`, [user.id, last4, 'tok_fake']);
            }

            // 3. Create Order (Saving 'gov' and 'phone' now)
            const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            db.run(`INSERT INTO orders (user_id, total, status, payment_method, items, address, gov, phone) VALUES (?, ?, 'Processing', ?, ?, ?, ?, ?)`,
                [user.id, total, paymentMethod, JSON.stringify(cart), address, gov || '', phone],
                function(err) {
                    if(err) {
                        console.error(err);
                        return res.status(500).json({success: false, message: "DB Error"});
                    }
                    res.json({ success: true, id: this.lastID, date: new Date(), total, items: cart, address, gov, phone, paymentMethod, status: 'Processing' });
                }
            );
        })
        .catch(err => {
            res.status(400).json({ success: false, message: err.message || "Stock Error" });
        });
};

exports.getUserOrders = (req, res) => {
    const user = getUser(req);
    if (!user) return res.status(401).json([]);
    // Select all fields including gov and phone
    db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC`, [user.id], (err, rows) => res.json(rows));
};

exports.cancelOrder = (req, res) => {
    db.run(`UPDATE orders SET status = 'Cancelled' WHERE id = ?`, [req.params.id], (err) => res.json({ success: !err }));
};

exports.getAdminOrders = (req, res) => {
    // Join users to get user info, select all order info including gov
    db.all(`SELECT orders.*, users.name as user_name, users.email as user_email FROM orders JOIN users ON orders.user_id = users.id ORDER BY date DESC`, (err, rows) => res.json(rows));
};

exports.getUserCards = (req, res) => {
    const user = getUser(req);
    if(!user) return res.json([]);
    db.all(`SELECT id, card_last4 FROM cards WHERE user_id = ? ORDER BY id DESC`, [user.id], (err, rows) => res.json(rows));
};

// Updated Admin User View to include addresses derived from Order History
exports.getAllUsers = (req, res) => {
    db.all(`SELECT id, name, email, role, created_at FROM users WHERE role != 'admin'`, [], (err, users) => {
        if (err) return res.status(500).json([]);

        // For each user, fetch unique addresses/phones from their orders
        // This is a workaround since we don't have a dedicated address book table in this version
        const promises = users.map(user => {
            return new Promise((resolve) => {
                db.all(`SELECT DISTINCT address as text, gov, phone, 'Saved in Orders' as label FROM orders WHERE user_id = ? LIMIT 5`, [user.id], (err, rows) => {
                    user.addresses = rows || [];
                    // Attach the most recent phone found, or N/A
                    user.phone = rows && rows.length > 0 ? rows[0].phone : 'N/A';
                    resolve(user);
                });
            });
        });

        Promise.all(promises).then(updatedUsers => res.json(updatedUsers));
    });
};

exports.deleteUser = (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], (err) => res.json({ success: !err }));
};