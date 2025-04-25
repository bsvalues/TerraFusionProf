/**
 * Database Schema Push Script
 * 
 * This script uses Drizzle Kit to push schema changes to the database.
 * It's a safer alternative to SQL migrations for development, but should
 * be used with caution in production.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { schema } from '../schema/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection parameters
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create PostgreSQL client
const client = new pg.Client({ connectionString });

/**
 * Push schema changes to the database
 */
async function push() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Create Drizzle instance
    const db = drizzle(client, { schema });
    
    // Path to the migrations folder
    const migrationsFolder = path.join(__dirname, '../migrations');
    
    // Ensure migrations folder exists
    if (!fs.existsSync(migrationsFolder)) {
      fs.mkdirSync(migrationsFolder, { recursive: true });
    }
    
    // Generate the SQL migration
    const sql = await generateMigrationSql();
    
    // Write the SQL to a file
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
    const migrationFile = path.join(migrationsFolder, `${timestamp}_schema_push.sql`);
    fs.writeFileSync(migrationFile, sql);
    
    console.log(`Created migration file: ${migrationFile}`);
    
    // Apply the migration
    console.log('Applying migration...');
    await client.query(sql);
    
    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error pushing schema changes:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

/**
 * Generate SQL migration from schema
 * @returns {string} SQL migration
 */
async function generateMigrationSql() {
  // This is a simplified version for demonstration purposes.
  // In a real application, this would use Drizzle's schema introspection 
  // to generate the appropriate migration SQL.
  
  // Define enums creation
  const enumsSql = `
    DO $$ BEGIN
      CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'appraiser', 'reviewer', 'client', 'field_agent');
      CREATE TYPE IF NOT EXISTS property_type AS ENUM ('residential', 'commercial', 'industrial', 'land', 'mixed_use');
      CREATE TYPE IF NOT EXISTS report_status AS ENUM ('draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived');
      CREATE TYPE IF NOT EXISTS form_type AS ENUM ('property_details', 'site_inspection', 'valuation', 'comparable', 'environmental');
      CREATE TYPE IF NOT EXISTS image_type AS ENUM ('exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END $$;
  `;
  
  // Define tables creation
  const tablesSql = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role user_role NOT NULL DEFAULT 'appraiser',
      company VARCHAR(255),
      phone_number VARCHAR(20),
      license_number VARCHAR(50),
      license_state VARCHAR(2),
      profile_image_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Properties table
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(2) NOT NULL,
      zip_code VARCHAR(10) NOT NULL,
      county VARCHAR(100),
      latitude DECIMAL(10, 7),
      longitude DECIMAL(10, 7),
      property_type property_type NOT NULL,
      year_built INTEGER,
      bedrooms DECIMAL(4, 1),
      bathrooms DECIMAL(4, 1),
      building_size DECIMAL(12, 2),
      lot_size DECIMAL(12, 2),
      lot_unit VARCHAR(10) DEFAULT 'sqft',
      parking_spaces INTEGER,
      parking_type VARCHAR(50),
      tax_assessed_value DECIMAL(12, 2),
      tax_year INTEGER,
      zoned_as VARCHAR(50),
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Property images table
    CREATE TABLE IF NOT EXISTS property_images (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id),
      url TEXT NOT NULL,
      caption VARCHAR(255),
      type image_type NOT NULL DEFAULT 'exterior',
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      uploaded_by INTEGER REFERENCES users(id),
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Appraisal reports table
    CREATE TABLE IF NOT EXISTS appraisal_reports (
      id SERIAL PRIMARY KEY,
      report_number VARCHAR(50) NOT NULL UNIQUE,
      property_id INTEGER NOT NULL REFERENCES properties(id),
      client_id INTEGER REFERENCES users(id),
      appraiser_id INTEGER NOT NULL REFERENCES users(id),
      reviewer_id INTEGER REFERENCES users(id),
      status report_status NOT NULL DEFAULT 'draft',
      effective_date DATE NOT NULL,
      inspection_date DATE,
      purpose VARCHAR(255) NOT NULL,
      approaches_used TEXT,
      estimated_value DECIMAL(12, 2),
      final_value DECIMAL(12, 2),
      confidence_score DECIMAL(3, 2),
      valuation_method VARCHAR(100),
      comments TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      submitted_at TIMESTAMP,
      approved_at TIMESTAMP,
      finalized_at TIMESTAMP
    );

    -- Comparable properties table
    CREATE TABLE IF NOT EXISTS comparables (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES appraisal_reports(id),
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(2) NOT NULL,
      zip_code VARCHAR(10) NOT NULL,
      latitude DECIMAL(10, 7),
      longitude DECIMAL(10, 7),
      property_type property_type NOT NULL,
      year_built INTEGER,
      bedrooms DECIMAL(4, 1),
      bathrooms DECIMAL(4, 1),
      building_size DECIMAL(12, 2),
      lot_size DECIMAL(12, 2),
      sale_price DECIMAL(12, 2) NOT NULL,
      sale_date DATE NOT NULL,
      days_on_market INTEGER,
      distance_in_miles DECIMAL(5, 2),
      similarity_score DECIMAL(3, 2),
      adjusted_price DECIMAL(12, 2),
      adjustments TEXT,
      description TEXT,
      image_url TEXT,
      added_by INTEGER REFERENCES users(id),
      added_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Forms table
    CREATE TABLE IF NOT EXISTS forms (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type form_type NOT NULL,
      schema TEXT NOT NULL,
      ui_schema TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_required BOOLEAN NOT NULL DEFAULT FALSE,
      property_types TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Form submissions table
    CREATE TABLE IF NOT EXISTS form_submissions (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES forms(id),
      report_id INTEGER NOT NULL REFERENCES appraisal_reports(id),
      data TEXT NOT NULL,
      submitted_by INTEGER NOT NULL REFERENCES users(id),
      submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completion_status DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
      validation_status BOOLEAN NOT NULL DEFAULT TRUE,
      validation_errors TEXT
    );

    -- Market data table
    CREATE TABLE IF NOT EXISTS market_data (
      id SERIAL PRIMARY KEY,
      location VARCHAR(100) NOT NULL,
      property_type property_type NOT NULL,
      period VARCHAR(20) NOT NULL,
      median_price DECIMAL(12, 2),
      average_price DECIMAL(12, 2),
      inventory_count INTEGER,
      days_on_market INTEGER,
      months_of_supply DECIMAL(4, 1),
      sold_count INTEGER,
      listed_count INTEGER,
      price_per_sqft DECIMAL(8, 2),
      year_over_year_change DECIMAL(5, 2),
      quarter_over_quarter_change DECIMAL(5, 2),
      update_date TIMESTAMP NOT NULL DEFAULT NOW(),
      data_source VARCHAR(100),
      UNIQUE(location, property_type, period)
    );
  `;
  
  // Combine all SQL statements
  return `${enumsSql}\n${tablesSql}`;
}

// Run the push function if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  push().catch(console.error);
}

export { push, generateMigrationSql };