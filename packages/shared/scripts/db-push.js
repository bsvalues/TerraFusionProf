/**
 * Database Schema Push Script
 * 
 * This script uses Drizzle Kit to push schema changes to the database.
 * It's a safer alternative to SQL migrations for development, but should
 * be used with caution in production.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../schema/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
};

// Migrations directory
const migrationsDir = path.join(__dirname, '../migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Create connection pool and Drizzle instance
const pool = new Pool(dbConfig);
const db = drizzle(pool, { schema });

async function push() {
  try {
    console.log('Connecting to database...');
    
    // Test the connection
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    
    // Generate migrations
    console.log('Generating migrations...');
    
    await execAsync(`npx drizzle-kit generate:pg --schema=./schema/index.js --out=./migrations`);
    
    console.log('Migrations generated successfully');
    
    // Apply migrations
    console.log('Applying migrations...');
    
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('Database schema updated successfully');
  } catch (error) {
    console.error('Failed to update database schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
push();