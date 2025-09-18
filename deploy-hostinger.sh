#!/bin/bash

# Hostinger Deployment Script
# Run this script to prepare your project for Hostinger deployment

echo "🚀 Preparing NutriSap for Hostinger deployment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 3. Build the project
echo "🏗️ Building project..."
npm run build

# 4. Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Check for errors above."
    exit 1
fi

# 5. Create deployment package
echo "📦 Creating deployment package..."

# Create a deployment directory
mkdir -p hostinger-deploy

# Copy necessary files
cp -r .next hostinger-deploy/
cp -r public hostinger-deploy/
cp -r node_modules hostinger-deploy/
cp package.json hostinger-deploy/
cp package-lock.json hostinger-deploy/
cp next.config.js hostinger-deploy/ 2>/dev/null || echo "No next.config.js found"
cp prisma hostinger-deploy/ -r
cp .env.hostinger hostinger-deploy/.env

echo "📋 Deployment checklist:"
echo "1. ✅ Dependencies installed"
echo "2. ✅ Prisma client generated"
echo "3. ✅ Project built successfully"
echo "4. ✅ Deployment package created in 'hostinger-deploy' folder"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env file in hostinger-deploy folder with your database credentials"
echo "2. Upload the entire 'hostinger-deploy' folder to your Hostinger account"
echo "3. Set up MySQL database in Hostinger control panel"
echo "4. Run 'npx prisma db push' on your Hostinger server"
echo "5. Start your application with 'npm start'"
echo ""
echo "📖 For detailed instructions, see HOSTINGER_DEPLOY.md"