# Deploy to Glitch - Quick Guide

Glitch is the easiest deployment option - no complex configuration needed!

## 🚀 Deployment Steps

### Method 1: Import from GitHub (Recommended - Easiest!)

1. **Go to Glitch**
   - Visit: https://glitch.com
   - Click **"Sign in"** (use GitHub account for easy access)

2. **Create New Project**
   - Click **"New Project"** button (top right)
   - Select **"Import from GitHub"**

3. **Import Your Repository**
   - Paste your repo URL: `https://github.com/auratechvisionteam/ims`
   - Click **"OK"**
   - Glitch will automatically import and start your app!

4. **Wait for Setup** (2-3 minutes)
   - Glitch will install dependencies
   - Initialize the database
   - Start the server

5. **View Your App**
   - Click **"Show"** → **"In a New Window"**
   - Your app URL will be: `https://your-project-name.glitch.me`

### Method 2: Manual Upload

1. **Create New Project**
   - Go to https://glitch.com
   - Click **"New Project"** → **"glitch-hello-node"**

2. **Import Code**
   - Click **"Tools"** (bottom left)
   - Select **"Import from GitHub"**
   - Paste: `https://github.com/auratechvisionteam/ims`

## ⚙️ Important Glitch Settings

### Environment Variables (Required!)

After import, add environment variables:

1. Click **"Tools"** → **"Terminal"**
2. Type:
   ```bash
   echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
   echo "NODE_ENV=production" >> .env
   ```

OR manually create `.env` file:
1. Click **"New File"**
2. Name it `.env`
3. Add:
   ```
   JWT_SECRET=your-random-secret-key-here
   NODE_ENV=production
   PORT=3000
   ```

### Initialize Database

1. Click **"Tools"** → **"Terminal"**
2. Run:
   ```bash
   npm install
   node scripts/init-db.js
   ```

3. Refresh the app!

## 🔄 How to Update Your App

When you push changes to GitHub:

1. In Glitch, click **"Tools"** → **"Import and Export"**
2. Click **"Import from GitHub"**
3. Paste your repo URL again
4. Glitch will update your app!

## 📝 Default Login Credentials

After deployment:
- **Email:** `admin@anits.edu.in`
- **Password:** `admin123`

⚠️ **Change this password immediately after first login!**

## ⚡ Glitch Free Tier Details

**What You Get:**
- ✅ Free forever
- ✅ HTTPS included
- ✅ Auto-deploy from GitHub
- ✅ 512 MB RAM
- ✅ 200 MB disk space

**Limitations:**
- ⚠️ **Sleeps after 5 min inactivity** (wakes up in ~30 seconds)
- ⚠️ Limited to 4,000 requests/hour
- ⚠️ SQLite database may have persistence issues (use carefully)

**To Keep App Awake:**
- Use a free uptime monitor like https://uptimerobot.com
- Ping your app every 4 minutes

## 🔧 Troubleshooting

### App Not Starting?

1. Check logs: Click **"Tools"** → **"Logs"**
2. Make sure `.env` file exists
3. Run `npm install` in terminal

### Database Issues?

1. Open Terminal
2. Run:
   ```bash
   node scripts/init-db.js
   ```
3. Restart the app

### File Upload Issues?

Glitch has limited storage. For production, consider:
- Using cloud storage (Cloudinary, AWS S3)
- Or upgrade to Railway/Render for better persistence

## 🎨 Customize Your Glitch Project

1. Click project name (top left)
2. Click **"Edit Project Details"**
3. Change:
   - Project name (your URL)
   - Description
   - Add avatar

## 🌐 Get Your Live URL

Your app will be at:
```
https://your-project-name.glitch.me
```

To find your exact URL:
- Click **"Share"** button
- Copy the **"Live App"** link

## 🔗 Custom Domain (Paid Feature)

Glitch supports custom domains on paid plans:
- **Glitch Pro** ($8/month): Custom domain + no sleep + more resources

## ⬆️ Better Alternatives for Production

If you need better reliability:
- **Railway** - $5 credit/month, no sleep
- **Render** - Free tier with persistent disk
- Both support SQLite better than Glitch

## 📚 Resources

- Glitch Docs: https://glitch.com/help
- Community: https://support.glitch.com
- Status: https://status.glitch.com

---

## 🎯 Quick Start Checklist

- [ ] Sign in to Glitch
- [ ] Import from GitHub: `https://github.com/auratechvisionteam/ims`
- [ ] Create `.env` file with JWT_SECRET
- [ ] Run `node scripts/init-db.js` in terminal
- [ ] Click "Show" to view your app
- [ ] Login with default credentials
- [ ] Change admin password immediately!

**Your app should be live in under 5 minutes!** 🚀
