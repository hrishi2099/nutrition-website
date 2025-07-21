# Database Setup Guide

This guide will help you set up a production PostgreSQL database for your nutrition website.

## Option 1: Neon Database (Recommended - Free Tier Available)

### Step 1: Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with your GitHub account or email
3. Create a new project called "nutrition-website"

### Step 2: Get Connection String
1. In your Neon dashboard, go to the "Connection Details" section
2. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Configure Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your project → Settings → Environment Variables
3. Add a new environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon connection string
   - **Environment**: Production, Preview, Development (select all)

### Step 4: Deploy Database Schema and Seed Data
You have two options:

**Option A: Automatic (during next Vercel deployment)**
- The next time you deploy, Vercel will automatically set up the database schema
- You'll need to seed the data manually after deployment

**Option B: Manual Setup (Recommended)**
1. Set the DATABASE_URL in your local environment:
   ```bash
   export DATABASE_URL="your_neon_connection_string_here"
   ```
2. Run the database deployment script:
   ```bash
   npm run db:deploy
   ```

## Alternative Database Providers

### PlanetScale
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get the connection string and follow the same steps as above

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the PostgreSQL connection string from Settings → Database
4. Follow the same configuration steps

## Seeding Production Database

After setting up the database, you can seed it with initial data:

```bash
# Make sure DATABASE_URL points to your production database
npm run db:seed
```

This will create:
- Admin user: `admin@nutrisap.com` (password: `password123`)
- Sample diet plans
- Blog posts and categories
- Contact information

## Verifying the Setup

1. Deploy your application to Vercel
2. Try logging in with admin credentials
3. Check that the contact page displays properly
4. Test the admin panel functionality

## Troubleshooting

### Database Connection Issues
- Make sure the DATABASE_URL is correctly set in Vercel
- Check that your database allows connections from Vercel's IP ranges
- Ensure the connection string includes `?sslmode=require` for secure connections

### Schema Issues
- If you see database errors, try running: `npx prisma db push --accept-data-loss`
- For a fresh start: `npx prisma db push --force-reset && npm run db:seed`

### Admin Panel Not Working
- Verify that the admin user was created by checking your database
- Make sure JWT_SECRET is set in Vercel environment variables
- Check that all API routes are working properly

## Security Notes

- Never commit your DATABASE_URL to version control
- Use environment variables for all sensitive configuration
- Consider using database connection pooling for better performance
- Regularly backup your production database