# Infrastructure Management System

A comprehensive web application for managing infrastructure complaints in a college campus environment. This system allows faculty to report issues, maintenance staff to resolve them, and administrators to monitor everything with detailed analytics.

## Features

### User Roles

#### SuperAdmin
- Create, manage, and delete user accounts
- Reset passwords for any user
- Full access to all system features
- User management dashboard

#### Faculty
- Submit infrastructure complaints with details and optional photos
- Track complaint status (New, In Progress, Resolved)
- View personal complaint history
- Filter complaints by status

#### Maintenance Staff
- View complaints assigned to specific department
- Update complaint status
- Add resolution notes
- Department-specific assignment (Electrical, IT & Network, Carpentry, etc.)

#### Admin
- View all complaints across departments
- Access to comprehensive analytics dashboard
- View statistics: total complaints, open/resolved counts, average resolution time
- Interactive charts for data visualization
- View complaints grouped by faculty department
- Read-only access (cannot modify complaints)

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla JavaScript (SPA architecture)
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Chart.js
- **File Upload**: Multer

## Project Structure

```
infrastructure-management/
├── server.js                 # Main Express server
├── schema.sql               # Database schema
├── package.json             # Dependencies
├── .env                     # Environment variables
├── database.db              # SQLite database (created after init)
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── users.js            # User management endpoints
│   ├── complaints.js       # Complaint CRUD endpoints
│   └── stats.js            # Statistics endpoints
├── scripts/
│   └── init-db.js          # Database initialization script
├── utils/
│   ├── jwt.js              # JWT token utilities
│   └── logger.js           # Activity logging
├── uploads/
│   └── complaints/         # Uploaded complaint photos
└── public/
    ├── index.html          # Main HTML file
    └── js/
        ├── api.js          # API client module
        └── app.js          # Frontend application controller
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Initialize Database

```bash
npm run init-db
```

This will:
- Create the SQLite database
- Set up all required tables
- Create default SuperAdmin account

### Step 3: Start the Server

```bash
npm start
```

The application will be available at: **http://localhost:3000**

## Default Credentials

**SuperAdmin Account**
- Email: `admin@anits.edu.in`
- Password: `admin123`

**Important**: Change the default password after first login for security.

## Environment Variables

Create a `.env` file in the root directory (or use the existing one):

```env
JWT_SECRET=your-secret-key-here-change-this-in-production
PORT=3000
NODE_ENV=development
```

## API Documentation

### Authentication

#### POST `/api/auth/login`
Login with credentials
```json
{
  "email": "user@anits.edu.in",
  "password": "password123",
  "role": "Faculty",
  "department": "CSD" // required for Maintenance role
}
```

### User Management (SuperAdmin only)

#### GET `/api/users`
Get all users

#### POST `/api/users`
Create new user
```json
{
  "email": "user@anits.edu.in",
  "password": "password123",
  "name": "John Doe",
  "role": "Faculty",
  "department": "CSD"
}
```

#### POST `/api/users/:id/reset-password`
Reset user password
```json
{
  "newPassword": "newpassword123"
}
```

#### DELETE `/api/users/:id`
Delete user

### Complaints

#### GET `/api/complaints`
Get complaints (filtered by role)
- Query params: `status`, `department`

#### GET `/api/complaints/:id`
Get single complaint with activity log

#### POST `/api/complaints`
Create complaint (Faculty only)
- Multipart form data with optional photo upload

#### PATCH `/api/complaints/:id`
Update complaint (Maintenance only)
```json
{
  "status": "In Progress",
  "resolution_notes": "Working on it"
}
```

### Statistics (Admin/SuperAdmin only)

#### GET `/api/stats/dashboard`
Get dashboard statistics

#### GET `/api/stats/by-department`
Get complaints grouped by maintenance department

#### GET `/api/stats/by-status`
Get complaints grouped by status

#### GET `/api/stats/by-faculty-department`
Get complaints grouped by faculty department

## Database Schema

### Users Table
- `id`, `email`, `password_hash`, `name`, `role`, `department`
- `created_at`, `created_by`, `require_password_change`, `last_login`

### Complaints Table
- `id`, `title`, `description`, `status`, `reported_by`
- `reported_by_name`, `reported_by_department`
- `block`, `floor`, `room`, `assigned_to`
- `created_at`, `resolved_at`, `resolution_notes`, `photo_path`

### Activity Log Table
- `id`, `complaint_id`, `user_id`, `action`, `details`, `timestamp`

## Departments

### Faculty Departments
- CSD (Computer Science & Design)
- CSM (Computer Science & Mathematics)
- CSC (Computer Science & Cyber Security)
- CSE (Computer Science & Engineering)
- ECE (Electronics & Communication Engineering)
- IT (Information Technology)
- EEE (Electrical & Electronics Engineering)
- MECH (Mechanical Engineering)
- CIVIL (Civil Engineering)
- CHEM (Chemical Engineering)
- ADMIN (Administration)

### Maintenance Departments
- Electrical
- IT & Network
- Carpentry
- Sanitary & Plumbing
- Housekeeping
- Maintenance
- Other

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication (24-hour expiry)
- Role-based access control
- File upload validation (type and size limits)
- SQL injection prevention
- XSS protection with HTML escaping

## Usage Guide

### For Faculty

1. Select "Faculty" role on login
2. Login with your credentials
3. Submit complaints using the form (add photos if needed)
4. Track your complaints in real-time
5. Filter by status to find specific complaints

### For Maintenance Staff

1. Select "Maintenance" role on login
2. Choose your department
3. View complaints assigned to your department
4. Update complaint status as you work on them
5. Add resolution notes when completing tasks

### For Admins

1. Select "Admin" role on login
2. View comprehensive dashboard with statistics
3. Monitor all complaints across departments
4. Analyze trends using interactive charts
5. View recent activity and complaint history

### For SuperAdmins

All admin features plus:
1. Access user management tab
2. Create new user accounts
3. Reset passwords for any user
4. Delete user accounts
5. Full system administration

## File Upload

- **Accepted formats**: JPG, PNG, GIF
- **Maximum size**: 5MB
- **Storage**: `uploads/complaints/` directory
- **Access**: Files served statically via `/uploads` route

## Development

### Running in Development Mode

```bash
npm run dev
```

### Database Reset

To reset the database:
1. Delete `database.db` file
2. Run `npm run init-db` again

## Production Deployment

1. Change `JWT_SECRET` in `.env` to a strong random value
2. Set `NODE_ENV=production`
3. Use a process manager (PM2, systemd)
4. Set up reverse proxy (nginx, Apache)
5. Enable HTTPS
6. Regular database backups
7. Change default SuperAdmin password

## Troubleshooting

### Port already in use
Change `PORT` in `.env` file

### Database errors
Delete `database.db` and run `npm run init-db`

### File upload errors
Check `uploads/complaints/` directory exists and has write permissions

### Authentication errors
Check `JWT_SECRET` is set in `.env`

## License

MIT License

## Support

For issues and questions, please contact the development team.

---

**Anil Neerukonda Institute of Technology & Sciences**
Infrastructure Management System v1.0
