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
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../../packages/shared/storage.js';
import { properties, propertyImages } from '../../packages/shared/schema/index.js';
import { eq, and, desc, asc, sql, like } from 'drizzle-orm';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PROPERTY_SERVICE_PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

// Authentication middleware - we assume the API Gateway already validated the token
// and set the user ID and role in the request headers
const authenticateRequest = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  
  if (!userId || !userRole) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = {
    id: Number(userId),
    role: userRole
  };
  
  next();
};

// Apply global middleware
app.use(logRequest);
app.use(authenticateRequest);

// Health check endpoint (doesn't require authentication)
app.get('/health', (req, res, next) => {
  res.json({
    status: 'healthy',
    service: 'property-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all properties
app.get('/properties', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt', 
      order = 'desc',
      propertyType,
      city,
      state,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      search
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query conditions
    let conditions = [];
    
    if (propertyType) {
      conditions.push(eq(properties.propertyType, propertyType));
    }
    
    if (city) {
      conditions.push(like(properties.city, `%${city}%`));
    }
    
    if (state) {
      conditions.push(eq(properties.state, state));
    }
    
    if (minBedrooms) {
      conditions.push(sql`${properties.bedrooms} >= ${Number(minBedrooms)}`);
    }
    
    if (maxBedrooms) {
      conditions.push(sql`${properties.bedrooms} <= ${Number(maxBedrooms)}`);
    }
    
    if (minBathrooms) {
      conditions.push(sql`${properties.bathrooms} >= ${Number(minBathrooms)}`);
    }
    
    if (maxBathrooms) {
      conditions.push(sql`${properties.bathrooms} <= ${Number(maxBathrooms)}`);
    }
    
    if (search) {
      conditions.push(
        sql`(${properties.address} ILIKE ${`%${search}%`} OR 
             ${properties.city} ILIKE ${`%${search}%`} OR
             ${properties.county} ILIKE ${`%${search}%`} OR
             ${properties.description} ILIKE ${`%${search}%`})`
      );
    }
    
    // Create query
    let query = db.select()
      .from(properties);
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    if (order.toLowerCase() === 'desc') {
      query = query.orderBy(desc(properties[sort]));
    } else {
      query = query.orderBy(asc(properties[sort]));
    }
    
    // Add pagination
    query = query.limit(Number(limit)).offset(offset);
    
    // Execute query
    const results = await query;
    
    // Count total records for pagination metadata
    const countQuery = db.select({ count: sql`count(*)` }).from(properties);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    
    const countResult = await countQuery;
    const total = Number(countResult[0].count);
    
    // Get primary images for each property
    const propertyIds = results.map(p => p.id);
    let primaryImages = [];
    
    if (propertyIds.length > 0) {
      primaryImages = await db.select()
        .from(propertyImages)
        .where(
          and(
            sql`${propertyImages.propertyId} IN (${propertyIds.join(',')})`,
            eq(propertyImages.isPrimary, true)
          )
        );
    }
    
    // Map results with images
    const propertiesWithImages = results.map(property => {
      const primaryImage = primaryImages.find(img => img.propertyId === property.id);
      return {
        ...property,
        primaryImage: primaryImage ? primaryImage.imageUrl : null
      };
    });
    
    res.json({
      data: propertiesWithImages,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get property by ID
app.get('/properties/:id', async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    
    // Get property details
    const propertyResult = await db.select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
      
    if (propertyResult.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get property images
    const propertyImagesResult = await db.select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(desc(propertyImages.isPrimary), asc(propertyImages.uploadedAt));
    
    const result = {
      ...propertyResult[0],
      images: propertyImagesResult
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property details' });
  }
});

// Create new property
app.post('/properties', async (req, res) => {
  try {
    const { 
      address, 
      city, 
      state, 
      zipCode, 
      county, 
      country = 'USA',
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      lotSize,
      buildingSize,
      bedrooms,
      bathrooms,
      description,
      features
    } = req.body;
    
    // Validate required fields
    if (!address || !city || !state || !zipCode || !propertyType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['address', 'city', 'state', 'zipCode', 'propertyType']
      });
    }
    
    // Create new property
    const newProperty = await db.insert(properties)
      .values({
        address,
        city,
        state,
        zipCode,
        county,
        country,
        latitude,
        longitude,
        propertyType,
        yearBuilt,
        lotSize,
        buildingSize,
        bedrooms,
        bathrooms,
        description,
        features,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newProperty[0]);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property
app.put('/properties/:id', async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const { 
      address, 
      city, 
      state, 
      zipCode, 
      county, 
      country,
      latitude,
      longitude,
      propertyType,
      yearBuilt,
      lotSize,
      buildingSize,
      bedrooms,
      bathrooms,
      description,
      features
    } = req.body;
    
    // Check if property exists
    const existingProperty = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
      
    if (existingProperty.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Update property
    const updatedProperty = await db.update(properties)
      .set({
        address,
        city,
        state,
        zipCode,
        county,
        country,
        latitude,
        longitude,
        propertyType,
        yearBuilt,
        lotSize,
        buildingSize,
        bedrooms,
        bathrooms,
        description,
        features,
        updatedAt: new Date()
      })
      .where(eq(properties.id, propertyId))
      .returning();
    
    res.json(updatedProperty[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
app.delete('/properties/:id', async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    
    // Check if property exists
    const existingProperty = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
      
    if (existingProperty.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Delete property (this will cascade to images due to foreign key constraints)
    await db.delete(properties)
      .where(eq(properties.id, propertyId));
    
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Upload property image
app.post('/properties/:id/images', async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const { imageUrl, imageType, caption, isPrimary = false } = req.body;
    
    // Validate required fields
    if (!imageUrl || !imageType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['imageUrl', 'imageType']
      });
    }
    
    // Check if property exists
    const existingProperty = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
      
    if (existingProperty.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // If this image is primary, update any existing primary images
    if (isPrimary) {
      await db.update(propertyImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(propertyImages.propertyId, propertyId),
            eq(propertyImages.isPrimary, true)
          )
        );
    }
    
    // Add new image
    const newImage = await db.insert(propertyImages)
      .values({
        propertyId,
        imageUrl,
        imageType,
        caption,
        isPrimary,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newImage[0]);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload property image' });
  }
});

// Get property images
app.get('/properties/:id/images', async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    
    // Check if property exists
    const existingProperty = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
      
    if (existingProperty.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get property images
    const images = await db.select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(desc(propertyImages.isPrimary), asc(propertyImages.uploadedAt));
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching property images:', error);
    res.status(500).json({ error: 'Failed to fetch property images' });
  }
});

// Update property image
app.put('/properties/:propertyId/images/:id', async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId);
    const imageId = Number(req.params.id);
    const { imageUrl, imageType, caption, isPrimary } = req.body;
    
    // Check if property and image exist
    const existingImage = await db.select()
      .from(propertyImages)
      .where(
        and(
          eq(propertyImages.id, imageId),
          eq(propertyImages.propertyId, propertyId)
        )
      )
      .limit(1);
      
    if (existingImage.length === 0) {
      return res.status(404).json({ error: 'Property image not found' });
    }
    
    // If this image is being set as primary, update any existing primary images
    if (isPrimary && !existingImage[0].isPrimary) {
      await db.update(propertyImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(propertyImages.propertyId, propertyId),
            eq(propertyImages.isPrimary, true)
          )
        );
    }
    
    // Update image
    const updatedImage = await db.update(propertyImages)
      .set({
        imageUrl,
        imageType,
        caption,
        isPrimary
      })
      .where(eq(propertyImages.id, imageId))
      .returning();
    
    res.json(updatedImage[0]);
  } catch (error) {
    console.error('Error updating property image:', error);
    res.status(500).json({ error: 'Failed to update property image' });
  }
});

// Delete property image
app.delete('/properties/:propertyId/images/:id', async (req, res) => {
  try {
    const propertyId = Number(req.params.propertyId);
    const imageId = Number(req.params.id);
    
    // Check if property and image exist
    const existingImage = await db.select()
      .from(propertyImages)
      .where(
        and(
          eq(propertyImages.id, imageId),
          eq(propertyImages.propertyId, propertyId)
        )
      )
      .limit(1);
      
    if (existingImage.length === 0) {
      return res.status(404).json({ error: 'Property image not found' });
    }
    
    // Delete image
    await db.delete(propertyImages)
      .where(eq(propertyImages.id, imageId));
    
    // If this was a primary image, set a new primary image if available
    if (existingImage[0].isPrimary) {
      const remainingImages = await db.select()
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, propertyId))
        .orderBy(asc(propertyImages.uploadedAt))
        .limit(1);
      
      if (remainingImages.length > 0) {
        await db.update(propertyImages)
          .set({ isPrimary: true })
          .where(eq(propertyImages.id, remainingImages[0].id));
      }
    }
    
    res.json({ message: 'Property image deleted successfully' });
  } catch (error) {
    console.error('Error deleting property image:', error);
    res.status(500).json({ error: 'Failed to delete property image' });
  }
});

// Search properties
app.get('/properties/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long',
      });
    }
    
    // Create search query
    const searchQuery = db.select()
      .from(properties)
      .where(
        sql`(${properties.address} ILIKE ${`%${q}%`} OR 
             ${properties.city} ILIKE ${`%${q}%`} OR
             ${properties.county} ILIKE ${`%${q}%`} OR
             ${properties.zipCode} ILIKE ${`%${q}%`} OR
             ${properties.description} ILIKE ${`%${q}%`})`
      )
      .limit(Number(limit));
    
    // Execute query
    const results = await searchQuery;
    
    res.json(results);
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ error: 'Failed to search properties' });
  }
});

// Get property statistics
app.get('/properties/stats', async (req, res) => {
  try {
    // Count properties by type
    const propertiesByType = await db
      .select({
        type: properties.propertyType,
        count: sql`count(*)`.as('count')
      })
      .from(properties)
      .groupBy(properties.propertyType);
      
    // Count properties by state
    const propertiesByState = await db
      .select({
        state: properties.state,
        count: sql`count(*)`.as('count')
      })
      .from(properties)
      .groupBy(properties.state)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
      
    // Get total property count
    const totalPropertiesResult = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(properties);
      
    // Get average bedrooms and bathrooms
    const averagesResult = await db
      .select({
        avgBedrooms: sql`avg(${properties.bedrooms})`.as('avg_bedrooms'),
        avgBathrooms: sql`avg(${properties.bathrooms})`.as('avg_bathrooms')
      })
      .from(properties);
      
    // Get newest properties (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newPropertiesCount = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(properties)
      .where(sql`${properties.createdAt} >= ${thirtyDaysAgo}`);
      
    res.json({
      totalProperties: Number(totalPropertiesResult[0].count),
      newProperties: Number(newPropertiesCount[0].count),
      averageBedrooms: Number(averagesResult[0].avgBedrooms || 0).toFixed(1),
      averageBathrooms: Number(averagesResult[0].avgBathrooms || 0).toFixed(1),
      byType: propertiesByType.map(item => ({ ...item, count: Number(item.count) })),
      byState: propertiesByState.map(item => ({ ...item, count: Number(item.count) }))
    });
  } catch (error) {
    console.error('Error fetching property statistics:', error);
    res.status(500).json({ error: 'Failed to fetch property statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Property Service Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property service running on port ${PORT}`);
});

export default app;