/**
 * TerraFusionPro Shared Schema
 * 
 * This file exports the database schema definitions used across the platform.
 * It uses Drizzle ORM to define tables, relationships, and types.
 */

import { pgTable, serial, varchar, text, integer, boolean, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['admin', 'appraiser', 'reviewer', 'client', 'field_agent']);
export const propertyTypeEnum = pgEnum('property_type', ['residential', 'commercial', 'industrial', 'land', 'mixed_use']);
export const reportStatusEnum = pgEnum('report_status', ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived']);
export const formTypeEnum = pgEnum('form_type', ['property_details', 'site_inspection', 'valuation', 'comparable', 'environmental']);
export const propertyImageTypeEnum = pgEnum('image_type', ['exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('appraiser'),
  company: varchar('company', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  avatar: varchar('avatar', { length: 255 }),
  active: boolean('active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Properties table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 50 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  county: varchar('county', { length: 100 }),
  country: varchar('country', { length: 100 }).notNull().default('USA'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  lotSize: varchar('lot_size', { length: 50 }),
  buildingSize: varchar('building_size', { length: 50 }),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  description: text('description'),
  features: jsonb('features'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Property Images table
export const propertyImages = pgTable('property_images', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  imageType: propertyImageTypeEnum('image_type').notNull(),
  caption: varchar('caption', { length: 255 }),
  isPrimary: boolean('is_primary').default(false),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow()
});

// Appraisal Reports table
export const appraisalReports = pgTable('appraisal_reports', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  reportNumber: varchar('report_number', { length: 100 }).notNull(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientEmail: varchar('client_email', { length: 255 }),
  clientPhone: varchar('client_phone', { length: 50 }),
  appraisalDate: timestamp('appraisal_date').notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
  status: reportStatusEnum('status').notNull().default('draft'),
  valuation: integer('valuation'),
  valuePerSqft: integer('value_per_sqft'),
  methodology: varchar('methodology', { length: 100 }),
  conclusions: text('conclusions'),
  appraiser: integer('appraiser').references(() => users.id),
  reviewer: integer('reviewer').references(() => users.id),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Comparables table
export const comparables = pgTable('comparables', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => appraisalReports.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id),
  externalPropertyId: varchar('external_property_id', { length: 100 }),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 50 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  salePrice: integer('sale_price'),
  saleDate: timestamp('sale_date'),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  lotSize: varchar('lot_size', { length: 50 }),
  buildingSize: varchar('building_size', { length: 50 }),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  adjustments: jsonb('adjustments'),
  adjustedPrice: integer('adjusted_price'),
  description: text('description'),
  similarityScore: varchar('similarity_score', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Forms table
export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  formName: varchar('form_name', { length: 255 }).notNull(),
  formType: formTypeEnum('form_type').notNull(),
  schema: jsonb('schema').notNull(),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Form Submissions table
export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  formId: integer('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id),
  reportId: integer('report_id').references(() => appraisalReports.id),
  data: jsonb('data').notNull(),
  submittedBy: integer('submitted_by').references(() => users.id),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Export the entire schema
export const schema = {
  users,
  properties,
  propertyImages,
  appraisalReports,
  comparables,
  forms,
  formSubmissions
};