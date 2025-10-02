const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database.db');

// Get dashboard statistics (Admin/SuperAdmin only)
router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
    const db = new sqlite3.Database(dbPath);

    // Get overall stats
    const stats = {};

    db.get('SELECT COUNT(*) as total FROM complaints', [], (err, result) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        stats.total = result.total;

        db.get('SELECT COUNT(*) as open FROM complaints WHERE status != "Resolved"', [], (err, result) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            stats.open = result.open;

            db.get('SELECT COUNT(*) as resolved FROM complaints WHERE status = "Resolved"', [], (err, result) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Database error' });
                }

                stats.resolved = result.resolved;

                // Calculate average resolution time
                db.get(
                    `SELECT AVG(CAST((julianday(resolved_at) - julianday(created_at)) * 24 AS INTEGER)) as avg_hours
                     FROM complaints
                     WHERE status = 'Resolved' AND resolved_at IS NOT NULL`,
                    [],
                    (err, result) => {
                        if (err) {
                            db.close();
                            return res.status(500).json({ error: 'Database error' });
                        }

                        stats.avgResolutionTime = result.avg_hours ? Math.round(result.avg_hours) : 0;

                        // Get recent activity
                        db.all(
                            `SELECT al.*, u.name as user_name, u.role as user_role, c.title as complaint_title
                             FROM activity_log al
                             LEFT JOIN users u ON al.user_id = u.id
                             LEFT JOIN complaints c ON al.complaint_id = c.id
                             ORDER BY al.timestamp DESC
                             LIMIT 10`,
                            [],
                            (err, activities) => {
                                db.close();

                                if (err) {
                                    stats.recentActivity = [];
                                } else {
                                    stats.recentActivity = activities;
                                }

                                res.json(stats);
                            }
                        );
                    }
                );
            });
        });
    });
});

// Get complaints by maintenance department (Admin/SuperAdmin only)
router.get('/by-department', authenticateToken, requireAdmin, (req, res) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
        `SELECT assigned_to as department, COUNT(*) as count
         FROM complaints
         GROUP BY assigned_to
         ORDER BY count DESC`,
        [],
        (err, results) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(results);
        }
    );
});

// Get complaints by status (Admin/SuperAdmin only)
router.get('/by-status', authenticateToken, requireAdmin, (req, res) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
        `SELECT status, COUNT(*) as count
         FROM complaints
         GROUP BY status
         ORDER BY
            CASE status
                WHEN 'New' THEN 1
                WHEN 'In Progress' THEN 2
                WHEN 'Resolved' THEN 3
            END`,
        [],
        (err, results) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(results);
        }
    );
});

// Get complaints by faculty department (Admin/SuperAdmin only)
router.get('/by-faculty-department', authenticateToken, requireAdmin, (req, res) => {
    const db = new sqlite3.Database(dbPath);

    db.all(
        `SELECT reported_by_department as department, COUNT(*) as count
         FROM complaints
         GROUP BY reported_by_department
         ORDER BY count DESC`,
        [],
        (err, results) => {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(results);
        }
    );
});

module.exports = router;
