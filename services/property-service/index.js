/**
 * TerraFusionPro Property Service
 * 
 * This service handles property data management, storage, and retrieval.
 * It provides APIs for CRUD operations on property records, including
 * addressing, characteristics, images, and related metadata.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from '../../packages/shared/storage.js';
import { properties, propertyImages } from '../../packages/shared/schema/index.js';
import { eq, and, like, gte, lte } from 'drizzle-orm';

// Initialize Express app
const app = express();
const PORT = process.env.PROPERTY_SERVICE_PORT || 5001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'property-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all properties with pagination and filtering
app.get('/properties', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      propertyType,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minPrice,
      maxPrice,
      city,
      state,
      zipCode,
      searchQuery
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = {};
    
    // Apply filters if provided
    if (propertyType) whereClause.propertyType = propertyType;
    if (city) whereClause.city = city;
    if (state) whereClause.state = state;
    if (zipCode) whereClause.zipCode = zipCode;
    
    // Execute query
    const result = await db.select().from(properties)
      .where(whereClause)
      .limit(parseInt(limit))
      .offset(offset);
    
    // Get total count for pagination
    const countResult = await db.select({ count: db.fn.count() }).from(properties)
      .where(whereClause);
    
    // Format response
    res.json({
      data: result,
      pagination: {
        total: countResult[0].count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties', details: error.message });
  }
});

// Get property by ID with images
app.get('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get property details
    const property = await db.select().from(properties)
      .where(eq(properties.id, parseInt(id)))
      .limit(1);
    
    if (!property.length) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get property images
    const images = await db.select().from(propertyImages)
      .where(eq(propertyImages.propertyId, parseInt(id)))
      .orderBy(propertyImages.sortOrder);
    
    // Format response
    res.json({
      ...property[0],
      images
    });
  } catch (error) {
    console.error(`Error fetching property with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch property details', details: error.message });
  }
});

// Create new property
app.post('/properties', async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Validate required fields
    if (!propertyData.address || !propertyData.city || !propertyData.state || !propertyData.zipCode || !propertyData.propertyType) {
      return res.status(400).json({ error: 'Missing required property fields' });
    }
    
    // Extract user ID from auth header set by API Gateway
    const userId = req.headers['x-user-id'];
    if (userId) {
      propertyData.createdBy = parseInt(userId);
    }
    
    // Insert property record
    const result = await db.insert(properties).values(propertyData).returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property', details: error.message });
  }
});

// Update existing property
app.put('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;
    
    // Check if property exists
    const existingProperty = await db.select().from(properties)
      .where(eq(properties.id, parseInt(id)))
      .limit(1);
    
    if (!existingProperty.length) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Update timestamp
    propertyData.updatedAt = new Date();
    
    // Update property record
    const result = await db.update(properties)
      .set(propertyData)
      .where(eq(properties.id, parseInt(id)))
      .returning();
    
    res.json(result[0]);
  } catch (error) {
    console.error(`Error updating property with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update property', details: error.message });
  }
});

// Delete property
app.delete('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if property exists
    const existingProperty = await db.select().from(properties)
      .where(eq(properties.id, parseInt(id)))
      .limit(1);
    
    if (!existingProperty.length) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Delete related images first
    await db.delete(propertyImages)
      .where(eq(propertyImages.propertyId, parseInt(id)));
    
    // Delete property record
    await db.delete(properties)
      .where(eq(properties.id, parseInt(id)));
    
    res.status(204).end();
  } catch (error) {
    console.error(`Error deleting property with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete property', details: error.message });
  }
});

// Add property image
app.post('/properties/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const imageData = req.body;
    
    // Validate required fields
    if (!imageData.url || !imageData.type) {
      return res.status(400).json({ error: 'Missing required image fields' });
    }
    
    // Check if property exists
    const existingProperty = await db.select().from(properties)
      .where(eq(properties.id, parseInt(id)))
      .limit(1);
    
    if (!existingProperty.length) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Set property ID and other metadata
    imageData.propertyId = parseInt(id);
    
    // Extract user ID from auth header set by API Gateway
    const userId = req.headers['x-user-id'];
    if (userId) {
      imageData.uploadedBy = parseInt(userId);
    }
    
    // If image is set as primary, clear existing primary flag
    if (imageData.isPrimary) {
      await db.update(propertyImages)
        .set({ isPrimary: false })
        .where(and(
          eq(propertyImages.propertyId, parseInt(id)),
          eq(propertyImages.type, imageData.type)
        ));
    }
    
    // Insert image record
    const result = await db.insert(propertyImages).values(imageData).returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error adding property image:', error);
    res.status(500).json({ error: 'Failed to add property image', details: error.message });
  }
});

// Update property image
app.put('/properties/:propertyId/images/:imageId', async (req, res) => {
  try {
    const { propertyId, imageId } = req.params;
    const imageData = req.body;
    
    // Check if image exists
    const existingImage = await db.select().from(propertyImages)
      .where(and(
        eq(propertyImages.id, parseInt(imageId)),
        eq(propertyImages.propertyId, parseInt(propertyId))
      ))
      .limit(1);
    
    if (!existingImage.length) {
      return res.status(404).json({ error: 'Property image not found' });
    }
    
    // If setting as primary, clear existing primary flag
    if (imageData.isPrimary) {
      await db.update(propertyImages)
        .set({ isPrimary: false })
        .where(and(
          eq(propertyImages.propertyId, parseInt(propertyId)),
          eq(propertyImages.type, existingImage[0].type)
        ));
    }
    
    // Update image record
    const result = await db.update(propertyImages)
      .set(imageData)
      .where(eq(propertyImages.id, parseInt(imageId)))
      .returning();
    
    res.json(result[0]);
  } catch (error) {
    console.error(`Error updating property image with ID ${req.params.imageId}:`, error);
    res.status(500).json({ error: 'Failed to update property image', details: error.message });
  }
});

// Delete property image
app.delete('/properties/:propertyId/images/:imageId', async (req, res) => {
  try {
    const { propertyId, imageId } = req.params;
    
    // Check if image exists
    const existingImage = await db.select().from(propertyImages)
      .where(and(
        eq(propertyImages.id, parseInt(imageId)),
        eq(propertyImages.propertyId, parseInt(propertyId))
      ))
      .limit(1);
    
    if (!existingImage.length) {
      return res.status(404).json({ error: 'Property image not found' });
    }
    
    // Delete image record
    await db.delete(propertyImages)
      .where(eq(propertyImages.id, parseInt(imageId)));
    
    res.status(204).end();
  } catch (error) {
    console.error(`Error deleting property image with ID ${req.params.imageId}:`, error);
    res.status(500).json({ error: 'Failed to delete property image', details: error.message });
  }
});

// Get property statistics
app.get('/properties/stats/summary', async (req, res) => {
  try {
    // Get total property count
    const totalCountResult = await db.select({ count: db.fn.count() }).from(properties);
    
    // Get property counts by type
    const typeCountsQuery = db.select({
      propertyType: properties.propertyType,
      count: db.fn.count()
    })
    .from(properties)
    .groupBy(properties.propertyType);
    
    const typeCounts = await typeCountsQuery;
    
    // Get property counts by state
    const stateCountsQuery = db.select({
      state: properties.state,
      count: db.fn.count()
    })
    .from(properties)
    .groupBy(properties.state)
    .orderBy(db.fn.count(), "desc")
    .limit(10);
    
    const stateCounts = await stateCountsQuery;
    
    // Return statistics
    res.json({
      totalCount: totalCountResult[0].count,
      countsByType: typeCounts,
      topStates: stateCounts
    });
  } catch (error) {
    console.error('Error fetching property statistics:', error);
    res.status(500).json({ error: 'Failed to fetch property statistics', details: error.message });
  }
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property service running on port ${PORT}`);
});

export default server;