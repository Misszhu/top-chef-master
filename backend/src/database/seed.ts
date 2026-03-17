import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('--- Starting database seeding ---');
    
    // Path to the SQL file
    const sqlPath = path.join(__dirname, 'seeds', '001_seed_data.sql');
    
    // Read SQL file content
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('Executing seed SQL...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute SQL
    await client.query(sql);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('--- Database seeding completed successfully! ---');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the pool to allow the script to exit
    await pool.end();
  }
}

// Run the seed function
seed();
