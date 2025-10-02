# Deployment Guide - Render

This guide will help you deploy the Infrastructure Management System to Render.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com - it's free!)
- Git installed on your system

## Step-by-Step Deployment

### 1. Initialize Git Repository (if not already done)

```bash
cd /c/Users/manav/Downloads/Documents/Desktop/ims
git init
git add .
git commit -m "Initial commit - Infrastructure Management System"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `infrastructure-management-system`
3. **Don't** initialize with README (you already have files)
4. Click "Create repository"

### 3. Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/infrastructure-management-system.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 4. Deploy on Render

#### Option A: Using render.yaml (Recommended - Automatic)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your `infrastructure-management-system` repository
5. Render will automatically detect the `render.yaml` file
6. Click **"Apply"**
7. Wait for deployment to complete (5-10 minutes)

#### Option B: Manual Setup

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `infrastructure-management-system`
   - **Environment**: `Node`
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. Add Environment Variables:
   - Click **"Advanced"**
   - Add environment variables:
     ```
     NODE_ENV = production
     JWT_SECRET = (click "Generate" to create a random secret)
     PORT = 10000
     ```

6. Add Persistent Disk:
   - Click **"Add Disk"**
   - **Name**: `data`
   - **Mount Path**: `/opt/render/project/src`
   - **Size**: `1 GB`

7. Click **"Create Web Service"**

### 5. Wait for Deployment

The deployment process will:
- ✅ Install dependencies
- ✅ Create necessary directories
- ✅ Initialize the SQLite database
- ✅ Create default SuperAdmin account
- ✅ Start the server

This takes approximately 5-10 minutes.

### 6. Access Your Application

Once deployed, Render will provide you with a URL like:
```
https://infrastructure-management-system.onrender.com
```

**Default Login Credentials:**
- Email: `admin@anits.edu.in`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Post-Deployment

### View Logs

1. Go to your Render dashboard
2. Click on your service
3. Click **"Logs"** tab to view real-time logs

### Update Application

To deploy updates:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Render will automatically redeploy when it detects changes in the main branch.

### Database Backup

The database is stored on the persistent disk. To backup:

1. Go to Render dashboard → Your Service → **"Shell"**
2. Run: `cat database.db > backup.db`
3. Download using Render's file browser

### Custom Domain (Optional)

1. Go to your service settings
2. Click **"Custom Domains"**
3. Add your domain and follow DNS instructions

## Troubleshooting

### Build Fails

- Check the logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify `render-build.sh` has correct permissions

### Database Issues

- The persistent disk must be mounted at `/opt/render/project/src`
- Check logs to ensure `init-db.js` ran successfully
- Verify database file exists: `ls -la database.db`

### Application Crashes

- Check environment variables are set correctly
- Verify `JWT_SECRET` is generated
- Check logs for error messages

### Free Tier Limitations

Render's free tier:
- ✅ 750 hours/month (enough for 24/7 operation)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after inactivity may take 30-60 seconds
- ✅ 1 GB persistent disk included

To avoid spin-down, upgrade to paid tier ($7/month).

## Alternative: Railway Deployment

If you prefer Railway:

1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Add environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=(generate a random string)`
5. Railway will auto-detect and deploy Node.js app

## Security Recommendations

After deployment:

1. ✅ Change default SuperAdmin password
2. ✅ Use a strong, randomly generated `JWT_SECRET`
3. ✅ Enable HTTPS (Render provides this automatically)
4. ✅ Regularly backup your database
5. ✅ Monitor logs for suspicious activity
6. ✅ Keep dependencies updated

## Support

For issues:
- Check Render documentation: https://render.com/docs
- View application logs in Render dashboard
- Check GitHub repository issues

---

**Your application is now live on the internet!** 🚀

Access it at your Render URL and start managing infrastructure complaints!
