#!/usr/bin/env node

/**
 * Database Connection Test for Hostinger
 *
 * Usage:
 * 1. Update DATABASE_URL in .env file
 * 2. Run: node test-hostinger-db.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Testing Hostinger Database Connection...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('💡 Make sure your .env file contains:');
    console.log('   DATABASE_URL="mysql://username:password@host:3306/database"');
    process.exit(1);
  }

  console.log('📋 Database URL configured:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

  try {
    // Parse the database URL
    const url = new URL(databaseUrl);
    const connectionConfig = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
    };

    console.log('🔗 Connection details:');
    console.log(`   Host: ${connectionConfig.host}`);
    console.log(`   Port: ${connectionConfig.port}`);
    console.log(`   User: ${connectionConfig.user}`);
    console.log(`   Database: ${connectionConfig.database}\n`);

    // Test connection
    console.log('⏳ Attempting to connect...');
    const connection = await mysql.createConnection(connectionConfig);

    console.log('✅ Database connection successful!');

    // Test basic query
    console.log('🔍 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows[0]);

    // Test if we can create tables (for Prisma)
    console.log('🛠️ Testing table creation permissions...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS _test_table (
          id INT PRIMARY KEY AUTO_INCREMENT,
          test_column VARCHAR(255)
        )
      `);
      await connection.execute('DROP TABLE _test_table');
      console.log('✅ Table creation permissions verified!');
    } catch (error) {
      console.warn('⚠️ Table creation test failed:', error.message);
      console.log('💡 You may need to grant CREATE/DROP permissions to your database user');
    }

    await connection.end();

    console.log('\n🎉 Database connection test completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Run: npx prisma db push');
    console.log('   2. Run: npm run db:seed (optional)');
    console.log('   3. Deploy your application');

  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);

    console.log('\n🛠️ Troubleshooting tips:');

    if (error.code === 'ENOTFOUND') {
      console.log('   • Check if the hostname is correct');
      console.log('   • Verify you can access the database host from your current location');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   • Check username and password');
      console.log('   • Verify the user has access to the specified database');
      console.log('   • Check if the user has remote access permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   • Check if the database name is correct');
      console.log('   • Verify the database exists');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   • Check if MySQL is running on the specified host');
      console.log('   • Verify the port number (usually 3306)');
    }

    console.log('   • Double-check your DATABASE_URL format:');
    console.log('     mysql://username:password@hostname:3306/database_name');

    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the test
testDatabaseConnection();