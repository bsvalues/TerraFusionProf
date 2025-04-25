/**
 * TerraFusionPro Shared Storage Module
 * 
 * This module provides database connection and query utilities using Drizzle ORM.
 * It's a shared utility used across multiple services in the platform.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

/**
 * Run migrations on the database
 * @param {string} migrationsFolder - Path to migrations folder
 */
export const runMigrations = async (migrationsFolder) => {
  try {
    console.log(`Running migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Initialize the database connection and run health check
 */
export const initializeDatabase = async () => {
  try {
    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Export schema for convenience
export { schema };

export default {
  db,
  runMigrations,
  initializeDatabase,
  closeDatabase,
  schema
};