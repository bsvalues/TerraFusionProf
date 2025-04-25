/**
 * Database Schema Push Script
 * 
 * This script uses Drizzle Kit to push schema changes to the database.
 * It's a safer alternative to SQL migrations for development, but should
 * be used with caution in production.
 */

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, schema } from '../storage.js';
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migrations folder path
const MIGRATIONS_FOLDER = path.join(__dirname, '../migrations');

// Create migrations folder if it doesn't exist
if (!fs.existsSync(MIGRATIONS_FOLDER)) {
  fs.mkdirSync(MIGRATIONS_FOLDER, { recursive: true });
}

/**
 * Push schema changes to the database
 */
async function push() {
  try {
    console.log(`Pushing schema changes to database...`);
    
    // Create schema if it doesn't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS public;
    `);
    
    // Run migrations
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    
    console.log('Schema changes successfully applied to database');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing schema changes:', error);
    process.exit(1);
  }
}

// Run the migration
push();