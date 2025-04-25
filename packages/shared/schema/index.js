/**
 * TerraFusionPro Shared Schema
 * 
 * This file exports the database schema definitions used across the platform.
 * It uses Drizzle ORM to define tables, relationships, and types.
 */

import { pgTable, pgEnum, serial, uuid, varchar, text, integer, decimal, boolean, timestamp, json, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'appraiser', 'reviewer', 'client', 'field_agent']);
export const propertyTypeEnum = pgEnum('property_type', ['residential', 'commercial', 'industrial', 'land', 'mixed_use']);
export const reportStatusEnum = pgEnum('report_status', ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived']);
export const formTypeEnum = pgEnum('form_type', ['property_details', 'site_inspection', 'valuation', 'comparable', 'environmental']);
export const propertyImageTypeEnum = pgEnum('image_type', ['exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other']);

// Define tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('appraiser').notNull(),
  organization: varchar('organization', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  preferences: json('preferences').default({})
});

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  squareFeet: integer('square_feet'),
  lotSize: decimal('lot_size', { precision: 12, scale: 2 }),
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  floors: integer('floors'),
  basement: boolean('basement').default(false),
  garage: integer('garage'),
  pool: boolean('pool').default(false),
  description: text('description'),
  parcelNumber: varchar('parcel_number', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdById: integer('created_by_id').references(() => users.id),
  metadata: json('metadata').default({})
});

export const propertyImages = pgTable('property_images', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  caption: varchar('caption', { length: 500 }),
  type: propertyImageTypeEnum('type').default('exterior').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  uploadedById: integer('uploaded_by_id').references(() => users.id)
});

export const appraisalReports = pgTable('appraisal_reports', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  appraiserId: integer('appraiser_id').notNull().references(() => users.id),
  reviewerId: integer('reviewer_id').references(() => users.id),
  clientId: integer('client_id').references(() => users.id),
  status: reportStatusEnum('status').default('draft').notNull(),
  reportDate: timestamp('report_date').notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
  value: integer('value'),
  purpose: varchar('purpose', { length: 255 }),
  methodology: text('methodology'),
  notes: text('notes'),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  data: json('data').default({})
});

export const comparables = pgTable('comparables', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  reportId: integer('report_id').notNull().references(() => appraisalReports.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  squareFeet: integer('square_feet'),
  lotSize: decimal('lot_size', { precision: 12, scale: 2 }),
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  salePrice: integer('sale_price').notNull(),
  saleDate: timestamp('sale_date').notNull(),
  distanceFromSubject: decimal('distance_from_subject', { precision: 5, scale: 2 }),
  adjustments: json('adjustments').default({}),
  totalAdjustment: integer('total_adjustment'),
  adjustedPrice: integer('adjusted_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  source: varchar('source', { length: 100 })
});

export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: formTypeEnum('type').notNull(),
  schema: json('schema').notNull(),
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdById: integer('created_by_id').references(() => users.id)
});

export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  formId: integer('form_id').notNull().references(() => forms.id),
  propertyId: integer('property_id').references(() => properties.id),
  reportId: integer('report_id').references(() => appraisalReports.id),
  submittedById: integer('submitted_by_id').notNull().references(() => users.id),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  data: json('data').notNull(),
  updatedAt: timestamp('updated_at')
});

// Export the schema as an object
export const schema = {
  users,
  properties,
  propertyImages,
  appraisalReports,
  comparables,
  forms,
  formSubmissions
};