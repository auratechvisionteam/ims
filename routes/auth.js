const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateToken } = require('../utils/jwt');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database.db');

// Login
router.post('/login', async (req, res) => {
    const { email, password, role, department } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = new sqlite3.Database(dbPath);

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            db.close();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            db.close();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check role match
        if (role && user.role !== role) {
            db.close();
            return res.status(401).json({ error: 'Invalid role for this user' });
        }

        // For maintenance staff, check department
        if (user.role === 'Maintenance') {
            if (!department) {
                db.close();
                return res.status(400).json({ error: 'Department is required for maintenance staff' });
            }
            if (user.department !== department) {
                db.close();
                return res.status(401).json({ error: 'Invalid department for this user' });
            }
        }

        // Update last login
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id], (err) => {
            db.close();

            if (err) {
                console.error('Error updating last login:', err);
            }

            // Log activity
            logActivity(null, user.id, 'login', `User ${user.email} logged in`).catch(console.error);

            // Generate token
            const token = generateToken(user);

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    require_password_change: user.require_password_change
                }
            });
        });
    });
});

// Logout (client-side only, just for logging)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
