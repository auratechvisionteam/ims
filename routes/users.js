const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database.db');

// Get all users (SuperAdmin only)
router.get('/', authenticateToken, requireSuperAdmin, (req, res) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
        `SELECT id, email, name, role, department, created_at, last_login, require_password_change
         FROM users
         ORDER BY created_at DESC`,
        [],
        (err, users) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(users);
        }
    );
});

// Create new user (SuperAdmin only)
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    const { email, password, name, role, department } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    // Validate role
    const validRoles = ['Faculty', 'Maintenance', 'Admin', 'SuperAdmin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate department based on role
    if (role === 'Faculty') {
        const validFacultyDepts = ['CSD', 'CSM', 'CSC', 'CSE', 'ECE', 'IT', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'ADMIN'];
        if (!department || !validFacultyDepts.includes(department)) {
            return res.status(400).json({ error: 'Valid department is required for Faculty' });
        }
    } else if (role === 'Maintenance') {
        const validMaintenanceDepts = ['Electrical', 'IT & Network', 'Carpentry', 'Sanitary & Plumbing', 'Housekeeping', 'Maintenance', 'Other'];
        if (!department || !validMaintenanceDepts.includes(department)) {
            return res.status(400).json({ error: 'Valid department is required for Maintenance' });
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = new sqlite3.Database(dbPath);

    db.run(
        'INSERT INTO users (email, password_hash, name, role, department, created_by, require_password_change) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, department, req.user.id, 1],
        function(err) {
            db.close();

            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            // Log activity
            logActivity(null, req.user.id, 'create_user', `Created user ${email} with role ${role}`).catch(console.error);

            res.status(201).json({
                id: this.lastID,
                email,
                name,
                role,
                department,
                message: 'User created successfully'
            });
        }
    );
});

// Reset user password (SuperAdmin only)
router.post('/:id/reset-password', authenticateToken, requireSuperAdmin, async (req, res) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const db = new sqlite3.Database(dbPath);

    db.run(
        'UPDATE users SET password_hash = ?, require_password_change = 1 WHERE id = ?',
        [hashedPassword, userId],
        function(err) {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
                db.close();
                return res.status(404).json({ error: 'User not found' });
            }

            // Get user email for logging
            db.get('SELECT email FROM users WHERE id = ?', [userId], (err, user) => {
                db.close();

                if (!err && user) {
                    logActivity(null, req.user.id, 'reset_password', `Reset password for user ${user.email}`).catch(console.error);
                }

                res.json({ message: 'Password reset successfully' });
            });
        }
    );
});

// Delete user (SuperAdmin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, (req, res) => {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = new sqlite3.Database(dbPath);

    // Get user info before deleting
    db.get('SELECT email, role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            db.close();
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Log activity
            logActivity(null, req.user.id, 'delete_user', `Deleted user ${user.email} (${user.role})`).catch(console.error);

            res.json({ message: 'User deleted successfully' });
        });
    });
});

module.exports = router;
