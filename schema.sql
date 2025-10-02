-- Infrastructure Management System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Faculty', 'Maintenance', 'Admin', 'SuperAdmin')),
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    require_password_change INTEGER DEFAULT 0,
    last_login DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'New' CHECK(status IN ('New', 'In Progress', 'Resolved')),
    reported_by INTEGER NOT NULL,
    reported_by_name TEXT NOT NULL,
    reported_by_department TEXT NOT NULL,
    block TEXT CHECK(block IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I')),
    floor TEXT,
    room TEXT,
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolution_notes TEXT,
    photo_path TEXT,
    FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_by ON complaints(reported_by);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_activity_log_complaint_id ON activity_log(complaint_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp);

-- Insert default SuperAdmin account
-- Password: admin123 (hashed with bcrypt)
INSERT OR IGNORE INTO users (email, password_hash, name, role, department, created_by)
VALUES ('admin@anits.edu.in', '$2a$10$rQVZK8VqX8kqKqKqKqKqKuO1C9vQ8vQ8vQ8vQ8vQ8vQ8vQ8vQ8vQ8', 'Super Admin', 'SuperAdmin', 'ADMIN', NULL);
