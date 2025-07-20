# Deployment Guide

## Vercel Deployment

### Environment Variables Required

Add these environment variables in your Vercel dashboard:

1. `DATABASE_URL` - Your PostgreSQL connection string from Neon
2. `JWT_SECRET` - A secure random string for JWT token signing

### Steps to Deploy

1. **Connect your GitHub repository to Vercel**
   - Go to vercel.com and connect your GitHub account
   - Import the nutrition-website repository

2. **Add Environment Variables**
   - In Vercel dashboard, go to your project settings
   - Add the required environment variables listed above

3. **Deploy**
   - Vercel will automatically deploy on git push
   - The build process includes database migration via `prisma db push`

### Database Setup

The application uses PostgreSQL via Neon.tech. The connection string should include:
- SSL mode required
- Pooled connection recommended for serverless

### Troubleshooting

- **Database Connection Issues**: Check that DATABASE_URL is correctly set
- **Build Failures**: Ensure Prisma schema is valid and dependencies are installed
- **API Errors**: Check Vercel function logs for detailed error messages

### Fallback Data

The application includes fallback data for:
- Diet plans (sample plans if database is empty)
- Contact info (default company information)

This ensures the site remains functional even if database connection fails temporarily.