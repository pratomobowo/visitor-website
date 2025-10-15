const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Starting PostgreSQL database setup...');
  
  // First connect to postgres database to create our database
  const postgresPool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database first
    user: process.env.POSTGRES_USER || 'visitor',
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    console.log('📦 Creating database if it doesn\'t exist...');
    
    // Create the database if it doesn't exist
    await postgresPool.query(`CREATE DATABASE ${process.env.POSTGRES_DB || 'visitor_counter'}`);
    console.log('✅ Database created or already exists');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database already exists');
    } else {
      console.error('❌ Error creating database:', error);
      process.exit(1);
    }
  } finally {
    await postgresPool.end();
  }

  // Now connect to our database and run the schema
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'visitor_counter',
    user: process.env.POSTGRES_USER || 'visitor',
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, 'postgres-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Creating tables and functions...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');
    
    // Create default admin user with hashed password
    console.log('👤 Creating default admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role) 
      VALUES ($1, $2, 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, ['admin@visitor-counter.com', hashedPassword]);
    
    console.log('✅ Default admin user created');
    console.log('📧 Email: admin@visitor-counter.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('🎉 Database setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Run "npm install" to install dependencies');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Visit http://localhost:3000 and login with the admin credentials');
}

// Check if required environment variables are set
if (!process.env.POSTGRES_PASSWORD) {
  console.error('❌ POSTGRES_PASSWORD environment variable is required');
  process.exit(1);
}

setupDatabase().catch(console.error);