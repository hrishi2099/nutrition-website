#!/usr/bin/env node

/**
 * Database Deployment Script
 * 
 * This script helps deploy and seed the production database.
 * It can be run locally or in CI/CD to set up the database.
 */

const { execSync } = require('child_process');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function deployDatabase() {
  console.log('🚀 Starting database deployment...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set your DATABASE_URL environment variable and try again.');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is configured');

  // Generate Prisma Client
  runCommand('npx prisma generate', 'Generating Prisma Client');

  // Deploy database schema
  runCommand('npx prisma db push', 'Deploying database schema');

  // Seed the database
  runCommand('npm run db:seed', 'Seeding database with initial data');

  console.log('\n🎉 Database deployment completed successfully!');
  console.log('\nYour production database is now ready with:');
  console.log('- All database tables created');
  console.log('- Admin user: admin@nutrisap.com (password: password123)');
  console.log('- Sample diet plans and blog posts');
  console.log('- Contact information');
}

// Run the deployment
deployDatabase().catch((error) => {
  console.error('❌ Database deployment failed:', error);
  process.exit(1);
});