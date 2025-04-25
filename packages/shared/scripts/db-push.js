/**
 * Database Schema Push Script
 * 
 * This script uses Drizzle Kit to push schema changes to the database.
 * It's a safer alternative to SQL migrations for development, but should
 * be used with caution in production.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { schema } from '../schema/index.js';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create Drizzle ORM instance
const db = drizzle(pool, { schema });

/**
 * Push schema changes to the database
 */
async function push() {
  try {
    console.log('Starting schema push to database...');
    console.log(`Using connection string: ${process.env.DATABASE_URL.split('@')[1]}`);

    // Test connection
    const client = await pool.connect();
    console.log('Database connection established');
    client.release();

    // Migrations folder path (relative to this script)
    const migrationsFolder = path.join(__dirname, '../migrations');
    
    // Run migrations
    console.log(`Running migrations from ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    
    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error during schema push:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Execute push function
push();