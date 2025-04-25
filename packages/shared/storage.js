/**
 * TerraFusionPro Shared Storage Module
 * 
 * This module provides database connection and query utilities using Drizzle ORM.
 * It's a shared utility used across multiple services in the platform.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as schema from './schema/index.js';

// Get database connection details from environment variables
const {
  PGHOST,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPORT,
  DATABASE_URL
} = process.env;

// Create a connection pool
const connectionConfig = DATABASE_URL
  ? { connectionString: DATABASE_URL }
  : {
      host: PGHOST,
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
      port: PGPORT ? parseInt(PGPORT, 10) : 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

const pool = new pg.Pool(connectionConfig);

// Initialize drizzle ORM with our schema
export const db = drizzle(pool, { schema });

/**
 * Run migrations on the database
 * @param {string} migrationsFolder - Path to migrations folder
 */
export const runMigrations = async (migrationsFolder) => {
  console.log(`Running migrations from ${migrationsFolder}`);
  
  try {
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  }
};

/**
 * Initialize the database connection and run health check
 */
export const initializeDatabase = async () => {
  try {
    // Perform a simple query to verify connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection established');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('Database connection closed');
    return true;
  } catch (error) {
    console.error('Error closing database connection:', error);
    return false;
  }
};

export { schema };