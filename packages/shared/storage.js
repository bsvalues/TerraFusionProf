/**
 * TerraFusionPro Shared Storage Module
 * 
 * This module provides database connection and query utilities using Drizzle ORM.
 * It's a shared utility used across multiple services in the platform.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { schema } from './schema/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const { Pool } = pg;

// Create a PostgreSQL pool for database connections
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/terrafusionpro';
const pool = new Pool({ connectionString });

// Initialize Drizzle ORM with the connection pool and schema
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
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

/**
 * Initialize the database connection and run health check
 */
export const initializeDatabase = async () => {
  console.log('Initializing database connection...');
  
  try {
    // Perform a simple query to check database connection
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time');
      console.log(`Database connection established at ${result.rows[0].time}`);
    } finally {
      client.release();
    }
    
    // Check if migrations directory exists and has migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
      
      if (migrationFiles.length > 0) {
        console.log(`Found ${migrationFiles.length} migration files`);
        await runMigrations(migrationsDir);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async () => {
  console.log('Closing database connection pool...');
  
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
};

// Run database initialization when this module is imported
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
});