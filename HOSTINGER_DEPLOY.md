# 🚀 Hostinger Deployment Guide

## ⚡ Quick Fix for "Something went wrong" Error

### 1. **Check Hostinger Requirements**

**Minimum Requirements:**
- Node.js 18+ (check your Hostinger panel)
- MySQL database access
- Environment variables support

### 2. **Database Setup on Hostinger**

#### Option A: Use Hostinger's MySQL Database
1. **Create Database:**
   - Go to Hostinger Control Panel → Databases → MySQL
   - Create new database (e.g., `nutrition_db`)
   - Create database user with full permissions
   - Note down: database name, username, password, host

2. **Get Connection Details:**
   ```
   Host: usually 'localhost' or specific hostname
   Database: your_database_name
   Username: your_db_username
   Password: your_db_password
   Port: 3306 (default)
   ```

#### Option B: Use External Database (Recommended)
If Hostinger's MySQL is limited, use external database:

**PlanetScale (Free):**
1. Go to [planetscale.com](https://planetscale.com)
2. Create database named `nutrition-website`
3. Get connection string: `mysql://user:pass@aws.connect.psdb.cloud/db?sslaccept=strict`

**Railway (Free tier):**
1. Go to [railway.app](https://railway.app)
2. Create MySQL database
3. Get connection string from dashboard

### 3. **Environment Variables Setup**

Create `.env` file in your project root on Hostinger:

```bash
# Database Configuration
DATABASE_URL="mysql://username:password@host:3306/database_name"

# JWT Secret (REQUIRED - Generate strong secret)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# Company Information (Optional)
COMPANY_NAME="NutriSap"
COMPANY_EMAIL="info@yourdomain.com"
SUPPORT_EMAIL="support@yourdomain.com"
COMPANY_PHONE="+91-9876543210"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# Payment Gateways (Optional)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
```

### 4. **Upload and Deploy Steps**

#### Method A: File Manager Upload
1. **Build Project Locally:**
   ```bash
   npm run build
   ```

2. **Upload Files:**
   - Upload entire project to Hostinger's `public_html` or domain folder
   - Make sure `.env` file is uploaded and configured

3. **Set Permissions:**
   - Ensure Node.js app permissions are set correctly
   - Check that `.next` folder has write permissions

#### Method B: Git Deployment (if supported)
1. **Connect Repository:**
   - Use Hostinger's Git deployment feature
   - Connect to your GitHub repository

2. **Set Environment Variables:**
   - Add environment variables in Hostinger control panel
   - Or ensure `.env` file is properly configured

### 5. **Database Migration**

After uploading, run database setup:

```bash
# SSH into your Hostinger server or use terminal
npx prisma db push
npx prisma db seed  # Optional: for initial data
```

### 6. **Hostinger-Specific Configuration**

#### Update `package.json` scripts:
```json
{
  "scripts": {
    "start": "next start -p 3000",
    "build": "next build",
    "postinstall": "prisma generate"
  }
}
```

#### Create `ecosystem.config.js` for PM2 (if using):
```javascript
module.exports = {
  apps: [{
    name: 'nutrition-website',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## 🔧 Troubleshooting Hostinger Issues

### "Something went wrong" Error:

**1. Check Error Logs:**
- Hostinger Control Panel → Error Logs
- Look for specific error messages

**2. Common Issues:**

**Database Connection Failed:**
```bash
# Error: Can't connect to MySQL server
# Fix: Check DATABASE_URL format and credentials
DATABASE_URL="mysql://user:pass@localhost:3306/dbname"
```

**Environment Variables Missing:**
```bash
# Error: JWT_SECRET is required
# Fix: Ensure .env file exists and is readable
JWT_SECRET="your-secret-key-here"
```

**Node.js Version Issues:**
```bash
# Error: Unsupported Node.js version
# Fix: Update Node.js in Hostinger panel to 18+
```

**Build Failures:**
```bash
# Error: Build failed
# Fix: Run build locally first, then upload built files
npm run build
# Upload .next folder and all dependencies
```

### **File Permissions Issues:**
```bash
# Set correct permissions for Node.js app
chmod -R 755 /path/to/your/app
chmod -R 644 /path/to/your/app/.env
```

## ✅ **Production Checklist for Hostinger**

### Required:
- [ ] Node.js 18+ enabled in Hostinger
- [ ] MySQL database created and accessible
- [ ] DATABASE_URL configured correctly
- [ ] JWT_SECRET set (32+ characters)
- [ ] Project built and uploaded successfully
- [ ] Environment variables file (.env) uploaded

### Optional:
- [ ] Domain pointed to application
- [ ] SSL certificate enabled
- [ ] Error monitoring set up
- [ ] Database seeded with initial data

## 🆘 **Emergency Fixes**

### If site shows "Something went wrong":

1. **Check Database Connection:**
   ```bash
   # Test database connection
   mysql -h hostname -u username -p database_name
   ```

2. **Verify Environment Variables:**
   ```bash
   # Check if .env file exists and is readable
   cat .env
   ```

3. **Check Application Logs:**
   - Hostinger Control Panel → Error Logs
   - Look for specific error messages

4. **Restart Application:**
   - Restart Node.js app in Hostinger control panel
   - Or restart via SSH/terminal

### **Quick Test Database Connection:**
Create test file `test-db.js`:
```javascript
const mysql = require('mysql2');
const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully!');
  }
  connection.end();
});
```

Run: `node test-db.js`

## 📞 **Hostinger Support**

If issues persist:
1. Contact Hostinger support with specific error messages
2. Share error logs from Hostinger control panel
3. Verify Node.js and database features are enabled in your plan

**Most Common Fix:** Ensure DATABASE_URL is correct and database is accessible from Hostinger's servers.