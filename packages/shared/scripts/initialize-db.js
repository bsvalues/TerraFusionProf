/**
 * Database Initialization Script
 * 
 * This script initializes the database with the required schema.
 */

import pg from 'pg';

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

/**
 * Initialize the database schema
 */
async function initializeDatabase() {
  console.log('Initializing database schema...');
  
  // Create a single client connection
  const client = new pg.Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Generate SQL for schema creation
    const sql = generateSchemaSql();
    
    // Execute SQL in a transaction
    await client.query('BEGIN');
    
    console.log('Executing schema creation SQL...');
    await client.query(sql);
    
    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Generate SQL for schema creation
 * @returns {string} SQL string
 */
function generateSchemaSql() {
  return `
-- Create enum types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'appraiser', 'reviewer', 'client', 'field_agent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'industrial', 'land', 'mixed_use');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_type') THEN
        CREATE TYPE form_type AS ENUM ('property_details', 'site_inspection', 'valuation', 'comparable', 'environmental');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'image_type') THEN
        CREATE TYPE image_type AS ENUM ('exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other');
    END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'appraiser',
    company VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    county VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    property_type property_type NOT NULL,
    year_built INTEGER,
    bedrooms DECIMAL(4,1),
    bathrooms DECIMAL(4,1),
    building_size DECIMAL(12,2),
    lot_size DECIMAL(12,2),
    lot_unit VARCHAR(10) DEFAULT 'sqft',
    parking_spaces INTEGER,
    parking_type VARCHAR(50),
    tax_assessed_value DECIMAL(12,2),
    tax_year INTEGER,
    zoned_as VARCHAR(50),
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
    estimated_value DECIMAL(12,2),
    final_value DECIMAL(12,2),
    confidence_score DECIMAL(3,2),
    valuation_method VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    finalized_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparables (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES appraisal_reports(id),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    property_type property_type NOT NULL,
    year_built INTEGER,
    bedrooms DECIMAL(4,1),
    bathrooms DECIMAL(4,1),
    building_size DECIMAL(12,2),
    lot_size DECIMAL(12,2),
    sale_price DECIMAL(12,2) NOT NULL,
    sale_date DATE NOT NULL,
    days_on_market INTEGER,
    distance_in_miles DECIMAL(5,2),
    similarity_score DECIMAL(3,2),
    adjusted_price DECIMAL(12,2),
    adjustments TEXT,
    description TEXT,
    image_url TEXT,
    added_by INTEGER REFERENCES users(id),
    added_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id),
    report_id INTEGER NOT NULL REFERENCES appraisal_reports(id),
    data TEXT NOT NULL,
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completion_status DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    validation_status BOOLEAN NOT NULL DEFAULT TRUE,
    validation_errors TEXT
);

CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    property_type property_type NOT NULL,
    period VARCHAR(20) NOT NULL,
    median_price DECIMAL(12,2),
    average_price DECIMAL(12,2),
    inventory_count INTEGER,
    days_on_market INTEGER,
    months_of_supply DECIMAL(4,1),
    sold_count INTEGER,
    listed_count INTEGER,
    price_per_sqft DECIMAL(8,2),
    year_over_year_change DECIMAL(5,2),
    quarter_over_quarter_change DECIMAL(5,2),
    update_date TIMESTAMP NOT NULL DEFAULT NOW(),
    data_source VARCHAR(100),
    UNIQUE(location, property_type, period)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(state, city, zip_code);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_reports_property_id ON appraisal_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_reports_status ON appraisal_reports(status);
CREATE INDEX IF NOT EXISTS idx_comparables_report_id ON comparables(report_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_report_id ON form_submissions(report_id);
CREATE INDEX IF NOT EXISTS idx_market_data_location ON market_data(location);
CREATE INDEX IF NOT EXISTS idx_market_data_property_type ON market_data(property_type);

-- Insert demo admin user for testing (password is hashed version of 'admin123')
INSERT INTO users (email, password, first_name, last_name, role, active)
VALUES (
    'admin@terrafusionpro.com',
    '$2a$10$OaJI4B9VsRsvkbLlA5HTM.eiIlZMnIxfljyS2LVAW1CInoHKlQRtW',
    'Admin',
    'User',
    'admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
`;
}

// Run the initialization function
initializeDatabase();