const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const schemaPath = path.join(__dirname, '..', 'schema.sql');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'complaints');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Read schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create database
const db = new sqlite3.Database(dbPath, async (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }

    console.log('Connected to SQLite database');

    // Execute schema
    db.exec(schema, async (err) => {
        if (err) {
            console.error('Error executing schema:', err);
            process.exit(1);
        }

        console.log('Database schema created successfully');

        // Create default SuperAdmin account
        const defaultPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        db.run(
            'INSERT OR REPLACE INTO users (id, email, password_hash, name, role, department, created_by) VALUES (1, ?, ?, ?, ?, ?, NULL)',
            ['admin@anits.edu.in', hashedPassword, 'Super Admin', 'SuperAdmin', 'ADMIN'],
            (err) => {
                if (err) {
                    console.error('Error creating default SuperAdmin:', err);
                } else {
                    console.log('Default SuperAdmin account created');
                    console.log('Email: admin@anits.edu.in');
                    console.log('Password: admin123');
                }

                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Database initialization complete');
                    }
                });
            }
        );
    });
});
