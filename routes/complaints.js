const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database.db');

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'complaints'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG and GIF are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Get complaints (filtered by role)
router.get('/', authenticateToken, (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const { status, department } = req.query;

    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];

    // Filter based on role
    if (req.user.role === 'Faculty') {
        query += ' AND reported_by = ?';
        params.push(req.user.id);
    } else if (req.user.role === 'Maintenance') {
        query += ' AND assigned_to = ?';
        params.push(req.user.department);
    }
    // Admin and SuperAdmin can see all complaints

    // Filter by status
    if (status && status !== 'All') {
        query += ' AND status = ?';
        params.push(status);
    }

    // Filter by faculty department (for Admin/SuperAdmin)
    if (department && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin')) {
        query += ' AND reported_by_department = ?';
        params.push(department);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, complaints) => {
        db.close();

        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(complaints);
    });
});

// Get single complaint
router.get('/:id', authenticateToken, (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const complaintId = req.params.id;

    db.get('SELECT * FROM complaints WHERE id = ?', [complaintId], (err, complaint) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!complaint) {
            db.close();
            return res.status(404).json({ error: 'Complaint not found' });
        }

        // Check access permissions
        if (req.user.role === 'Faculty' && complaint.reported_by !== req.user.id) {
            db.close();
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.role === 'Maintenance' && complaint.assigned_to !== req.user.department) {
            db.close();
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get activity log for this complaint
        db.all(
            `SELECT al.*, u.name as user_name, u.role as user_role
             FROM activity_log al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.complaint_id = ?
             ORDER BY al.timestamp DESC`,
            [complaintId],
            (err, activities) => {
                db.close();

                if (err) {
                    return res.json({ ...complaint, activities: [] });
                }

                res.json({ ...complaint, activities });
            }
        );
    });
});

// Create complaint (Faculty only)
router.post('/', authenticateToken, requireRole('Faculty'), upload.single('photo'), (req, res) => {
    const { description, block, floor, room, assigned_to } = req.body;

    // Validation
    if (!description) {
        return res.status(400).json({ error: 'Description is required' });
    }

    if (!assigned_to) {
        return res.status(400).json({ error: 'Maintenance department is required' });
    }

    // Validate assigned_to
    const validDepartments = ['Electrical', 'IT & Network', 'Carpentry', 'Sanitary & Plumbing', 'Housekeeping', 'Maintenance', 'Other'];
    if (!validDepartments.includes(assigned_to)) {
        return res.status(400).json({ error: 'Invalid maintenance department' });
    }

    // Generate title from first 40 chars of description
    const title = description.substring(0, 40) + (description.length > 40 ? '...' : '');

    const photoPath = req.file ? `/uploads/complaints/${req.file.filename}` : null;

    const db = new sqlite3.Database(dbPath);

    db.run(
        `INSERT INTO complaints (title, description, reported_by, reported_by_name, reported_by_department, block, floor, room, assigned_to, photo_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, req.user.id, req.user.name, req.user.department, block, floor, room, assigned_to, photoPath],
        function(err) {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const complaintId = this.lastID;

            // Log activity
            logActivity(complaintId, req.user.id, 'create_complaint', `Created complaint: ${title}`).catch(console.error);

            res.status(201).json({
                id: complaintId,
                title,
                message: 'Complaint submitted successfully'
            });
        }
    );
});

// Update complaint status (Maintenance only)
router.patch('/:id', authenticateToken, requireRole('Maintenance'), (req, res) => {
    const complaintId = req.params.id;
    const { status, resolution_notes } = req.body;

    // Validation
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['New', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const db = new sqlite3.Database(dbPath);

    // First check if complaint exists and is assigned to this maintenance department
    db.get('SELECT * FROM complaints WHERE id = ?', [complaintId], (err, complaint) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!complaint) {
            db.close();
            return res.status(404).json({ error: 'Complaint not found' });
        }

        if (complaint.assigned_to !== req.user.department) {
            db.close();
            return res.status(403).json({ error: 'This complaint is not assigned to your department' });
        }

        // Update complaint
        let updateQuery = 'UPDATE complaints SET status = ?';
        const params = [status];

        if (status === 'Resolved') {
            updateQuery += ', resolved_at = CURRENT_TIMESTAMP';
        }

        if (resolution_notes) {
            updateQuery += ', resolution_notes = ?';
            params.push(resolution_notes);
        }

        updateQuery += ' WHERE id = ?';
        params.push(complaintId);

        db.run(updateQuery, params, function(err) {
            db.close();

            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Log activity
            const actionDetails = `Updated status to ${status}${resolution_notes ? ': ' + resolution_notes : ''}`;
            logActivity(complaintId, req.user.id, 'update_status', actionDetails).catch(console.error);

            res.json({ message: 'Complaint updated successfully' });
        });
    });
});

module.exports = router;
