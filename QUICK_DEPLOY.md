# 🚀 Quick Production Deployment Guide

## ⚡ Emergency Fix for "Something went wrong" Error

If you're seeing "Something went wrong" on production, follow these steps:

### 1. **Immediate Database Fix** (Choose One Option)

#### Option A: Use PlanetScale (Recommended - Free)
1. Go to [planetscale.com](https://planetscale.com) and create account
2. Create new database named `nutrition-website`
3. Get connection string from dashboard
4. Add to Vercel environment variables:
```
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/nutrition-website?sslaccept=strict
```

#### Option B: Use Railway (Quick Setup)
1. Go to [railway.app](https://railway.app) and create account
2. Create new MySQL database
3. Get connection string from dashboard
4. Add to Vercel environment variables

#### Option C: Use Neon (PostgreSQL)
1. Go to [neon.tech](https://neon.tech) and create account
2. Create new database
3. **Important**: Change `prisma/schema.prisma` provider to `"postgresql"`
4. Add connection string to Vercel

### 2. **Set Environment Variables in Vercel**

Go to your Vercel project → Settings → Environment Variables:

**Required:**
```
DATABASE_URL=your_database_connection_string_here
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

**Optional (for better experience):**
```
COMPANY_NAME=NutriSap
COMPANY_EMAIL=info@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
COMPANY_PHONE=+91-9876543210
NEXT_PUBLIC_BASE_URL=https://yourdomain.vercel.app
```

### 3. **Deploy Database Schema**

After setting DATABASE_URL, trigger a new deployment or run:
```bash
# In Vercel dashboard, go to Deployments and "Redeploy"
# This will automatically run the database migration
```

### 4. **Seed Initial Data** (Optional)

The app works without seeded data, but for admin access:
```bash
# After successful deployment, go to:
https://yourdomain.vercel.app/api/auth/seed-admin
# This will create the admin user
```

## 🔧 Complete Deployment Steps

### For Vercel Deployment:

1. **Connect Repository**
   - Connect your GitHub repo to Vercel
   - Import project

2. **Configure Environment Variables**
   ```bash
   # Copy .env.example to get all variable names
   # Set at minimum: DATABASE_URL and JWT_SECRET
   ```

3. **Deploy**
   - Vercel will automatically deploy
   - Database schema will be created on first successful connection

4. **Verify**
   - Visit your deployed URL
   - Check that pages load without "Something went wrong"
   - Test authentication if needed

## 🆘 Troubleshooting

### "Something went wrong" Error:
- **Cause**: Database connection failed
- **Fix**: Ensure DATABASE_URL is correct and database is accessible

### "Authentication Failed":
- **Cause**: Missing or invalid JWT_SECRET
- **Fix**: Set a strong JWT_SECRET (32+ characters)

### "Database Connection Error":
- **Cause**: Database URL format incorrect
- **Fix**: Ensure correct format: `mysql://user:pass@host:port/db`

### "Migration Failed":
- **Cause**: Database schema mismatch
- **Fix**: Run `npx prisma db push --accept-data-loss` (locally) then redeploy

## 🎯 Production Checklist

### Immediate (Critical):
- [ ] DATABASE_URL set correctly
- [ ] JWT_SECRET set (32+ characters)
- [ ] Site loads without errors

### Optional (Enhanced):
- [ ] Admin user created
- [ ] Contact information configured
- [ ] Payment gateways configured
- [ ] Social media links set

## 📞 Need Help?

### Common Database URLs:
- **PlanetScale**: `mysql://user:pass@aws.connect.psdb.cloud/db?sslaccept=strict`
- **Railway**: `mysql://root:pass@containers-us-west-1.railway.app:6306/db`
- **Neon**: `postgresql://user:pass@host/db?sslmode=require`

### Test Your Database Connection:
```bash
# Run this locally with your DATABASE_URL:
npx prisma db push
npx prisma studio
```

If Prisma Studio opens successfully, your database connection works!