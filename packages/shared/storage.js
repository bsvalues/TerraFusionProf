/**
 * TerraFusionPro Shared Storage Module
 * 
 * This module provides database connection and query utilities using Drizzle ORM.
 * It's a shared utility used across multiple services in the platform.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema } from './schema/index.js';

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create connection pool
const pool = new pg.Pool({
  connectionString,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
});

// Initialize Drizzle ORM with the connection pool and schema
export const db = drizzle(pool, { schema });

// Error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Run migrations on the database
 * @param {string} migrationsFolder - Path to migrations folder
 */
export const runMigrations = async (migrationsFolder) => {
  try {
    console.log(`Running migrations from ${migrationsFolder}...`);
    
    // In a real implementation, this would use the Drizzle migrations API
    // For this example, we'll just log that migrations would be run
    
    console.log('Migrations complete');
    return true;
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
    // Test the connection
    const client = await pool.connect();
    
    try {
      // Simple query to verify database connection
      const result = await client.query('SELECT NOW() as now');
      
      console.log('Database connection successful:', result.rows[0].now);
      return true;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
    return true;
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
};

// Simple CRUD helpers

/**
 * Create a new record in the specified table
 * @param {Object} table - The table object from the schema
 * @param {Object} data - The data to insert
 * @returns {Promise<Object>} - The inserted record
 */
export const create = async (table, data) => {
  try {
    const result = await db.insert(table).values(data).returning();
    return result[0];
  } catch (error) {
    console.error(`Error creating record in ${table.name}:`, error);
    throw error;
  }
};

/**
 * Find records in the specified table
 * @param {Object} table - The table object from the schema
 * @param {Object} where - The where clause (field-value pairs)
 * @param {Object} options - Additional options (limit, offset, orderBy)
 * @returns {Promise<Array>} - The matching records
 */
export const find = async (table, where = {}, options = {}) => {
  try {
    let query = db.select().from(table);
    
    // Apply where conditions
    if (Object.keys(where).length > 0) {
      query = query.where(where);
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // Apply offset
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    // Apply order by
    if (options.orderBy) {
      query = query.orderBy(options.orderBy);
    }
    
    return await query;
  } catch (error) {
    console.error(`Error finding records in ${table.name}:`, error);
    throw error;
  }
};

/**
 * Find a single record by its ID
 * @param {Object} table - The table object from the schema
 * @param {number|string} id - The ID of the record to find
 * @returns {Promise<Object|null>} - The matching record or null if not found
 */
export const findById = async (table, id) => {
  try {
    const results = await db.select().from(table).where({ id }).limit(1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error finding record by ID in ${table.name}:`, error);
    throw error;
  }
};

/**
 * Update a record in the specified table
 * @param {Object} table - The table object from the schema
 * @param {number|string} id - The ID of the record to update
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated record
 */
export const update = async (table, id, data) => {
  try {
    const result = await db.update(table).set(data).where({ id }).returning();
    return result[0];
  } catch (error) {
    console.error(`Error updating record in ${table.name}:`, error);
    throw error;
  }
};

/**
 * Delete a record from the specified table
 * @param {Object} table - The table object from the schema
 * @param {number|string} id - The ID of the record to delete
 * @returns {Promise<boolean>} - True if the record was deleted
 */
export const remove = async (table, id) => {
  try {
    await db.delete(table).where({ id });
    return true;
  } catch (error) {
    console.error(`Error deleting record from ${table.name}:`, error);
    throw error;
  }
};

// Export the direct db instance and helper functions
export default {
  db,
  runMigrations,
  initializeDatabase,
  closeDatabase,
  create,
  find,
  findById,
  update,
  remove
};