import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app',
};

async function seedDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Read the seed SQL file
    const seedPath = path.join(process.cwd(), 'sql', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    console.log('📄 Reading seed file...');
    
    // Split the SQL into individual statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🚀 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
      }
    }

    console.log('🎉 Database seeded successfully!');
    console.log('📋 Created default rooms:');
    console.log('   - General Chat (ID: 1)');
    console.log('   - Welcome (ID: 2)');
    console.log('   - Random (ID: 3)');
    console.log('👥 All users have been added to these rooms');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

seedDatabase();
