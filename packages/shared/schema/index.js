/**
 * TerraFusionPro Shared Schema
 * 
 * This file exports the database schema definitions used across the platform.
 * It uses Drizzle ORM to define tables, relationships, and types.
 */

import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid, pgEnum, foreignKey } from 'drizzle-orm/pg-core';

// Create enums for various entity statuses and types
export const userRoleEnum = pgEnum('user_role', ['admin', 'appraiser', 'reviewer', 'client', 'field_agent']);
export const propertyTypeEnum = pgEnum('property_type', ['residential', 'commercial', 'industrial', 'land', 'mixed_use']);
export const reportStatusEnum = pgEnum('report_status', ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived']);
export const formTypeEnum = pgEnum('form_type', ['property_details', 'site_inspection', 'valuation', 'comparable', 'environmental']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: userRoleEnum('role').notNull().default('appraiser'),
  organization: text('organization'),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  preferences: jsonb('preferences').default({})
});

// Properties table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  squareFeet: integer('square_feet'),
  lotSize: text('lot_size'),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  description: text('description'),
  parcelNumber: text('parcel_number'),
  location: jsonb('location'), // For GeoJSON coordinates
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdById: integer('created_by_id').references(() => users.id),
  metadata: jsonb('metadata').default({})
});

// Property Images table
export const propertyImages = pgTable('property_images', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  url: text('url').notNull(),
  caption: text('caption'),
  isPrimary: boolean('is_primary').default(false),
  type: text('type').default('exterior'), // exterior, interior, aerial, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata').default({})
});

// Appraisal Reports table
export const appraisalReports = pgTable('appraisal_reports', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  appraiserId: integer('appraiser_id').notNull().references(() => users.id),
  reviewerId: integer('reviewer_id').references(() => users.id),
  clientId: integer('client_id').references(() => users.id),
  status: reportStatusEnum('status').notNull().default('draft'),
  reportDate: timestamp('report_date'),
  effectiveDate: timestamp('effective_date'),
  value: integer('value'), // Appraised value in cents
  purpose: text('purpose'),
  methodology: text('methodology'),
  notes: text('notes'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  data: jsonb('data').default({})
});

// Comparable Properties table
export const comparables = pgTable('comparables', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => appraisalReports.id),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  saleDate: timestamp('sale_date'),
  salePrice: integer('sale_price'), // Price in cents
  squareFeet: integer('square_feet'),
  yearBuilt: integer('year_built'),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  adjustments: jsonb('adjustments').default({}),
  adjustedPrice: integer('adjusted_price'), // Adjusted price in cents
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Forms table for dynamic form definitions
export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: formTypeEnum('type').notNull(),
  schema: jsonb('schema').notNull(), // JSON Schema defining the form
  version: text('version').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdById: integer('created_by_id').references(() => users.id)
});

// Form Submissions table
export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  formId: integer('form_id').notNull().references(() => forms.id),
  propertyId: integer('property_id').references(() => properties.id),
  reportId: integer('report_id').references(() => appraisalReports.id),
  submittedById: integer('submitted_by_id').notNull().references(() => users.id),
  data: jsonb('data').notNull(), // Form submission data
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Export the schema
export const schema = {
  users,
  properties,
  propertyImages,
  appraisalReports,
  comparables,
  forms,
  formSubmissions
};

export default schema;