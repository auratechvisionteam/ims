const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');

// Log activity to database
const logActivity = (complaintId, userId, action, details) => {
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO activity_log (complaint_id, user_id, action, details) VALUES (?, ?, ?, ?)',
            [complaintId, userId, action, details],
            function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
};

module.exports = {
    logActivity
};
