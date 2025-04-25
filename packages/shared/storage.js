/**
 * TerraFusionPro Shared Storage Module
 * 
 * This module provides database connection and query utilities using Drizzle ORM.
 * It's a shared utility used across multiple services in the platform.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { schema } from './schema/index.js';

// Create a PostgreSQL connection pool
const { Pool } = pg;

// Database connection configuration from environment variables
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Additional pool configuration
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection to become available
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = new Pool(poolConfig);

// Create Drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

/**
 * Run migrations on the database
 * @param {string} migrationsFolder - Path to migrations folder
 */
export const runMigrations = async (migrationsFolder) => {
  try {
    console.log(`Running migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log('Migrations complete.');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

/**
 * Initialize the database connection and run health check
 */
export const initializeDatabase = async () => {
  try {
    // Test database connection
    const testClient = await pool.connect();
    console.log('Database connection established.');
    
    // Run a simple query to verify connection is working
    const result = await testClient.query('SELECT NOW()');
    console.log(`Database health check successful at ${result.rows[0].now}`);
    
    testClient.release();
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('Database connection pool closed.');
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
};

// Handle process termination to properly close database connections
process.on('SIGINT', async () => {
  console.log('Closing database connections due to application termination');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections due to application termination');
  await closeDatabase();
  process.exit(0);
});

export default {
  db,
  runMigrations,
  initializeDatabase,
  closeDatabase
};