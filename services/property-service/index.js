/**
 * TerraFusionPro Property Service
 * 
 * This service handles property data management, storage, and retrieval.
 * It provides APIs for CRUD operations on property records, including
 * addressing, characteristics, images, and related metadata.
 */

import express from 'express';
import cors from 'cors';
import { db, schema, initializeDatabase } from '../../packages/shared/storage.js';
import { eq, desc, like, and, or } from 'drizzle-orm';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await initializeDatabase();
    
    res.json({
      service: 'property-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      service: 'property-service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get all properties with pagination and filtering
app.get('/properties', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      propertyType, 
      city, 
      state, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Build conditions
    let conditions = [];
    
    if (propertyType) {
      conditions.push(eq(schema.properties.propertyType, propertyType));
    }
    
    if (city) {
      conditions.push(eq(schema.properties.city, city));
    }
    
    if (state) {
      conditions.push(eq(schema.properties.state, state));
    }
    
    if (search) {
      // Search in multiple fields
      conditions.push(
        or(
          like(schema.properties.address, `%${search}%`),
          like(schema.properties.city, `%${search}%`),
          like(schema.properties.description, `%${search}%`)
        )
      );
    }
    
    // Build query
    let query = db.select({
      id: schema.properties.id,
      uuid: schema.properties.uuid,
      address: schema.properties.address,
      city: schema.properties.city,
      state: schema.properties.state,
      zipCode: schema.properties.zipCode,
      propertyType: schema.properties.propertyType,
      yearBuilt: schema.properties.yearBuilt,
      squareFeet: schema.properties.squareFeet,
      lotSize: schema.properties.lotSize,
      bedrooms: schema.properties.bedrooms,
      bathrooms: schema.properties.bathrooms,
      createdAt: schema.properties.createdAt,
      updatedAt: schema.properties.updatedAt
    })
    .from(schema.properties);
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    if (sortBy && sortOrder) {
      if (sortOrder.toLowerCase() === 'desc') {
        query = query.orderBy(desc(schema.properties[sortBy]));
      } else {
        query = query.orderBy(schema.properties[sortBy]);
      }
    }
    
    // Add pagination
    query = query.limit(limit).offset(offset);
    
    // Execute query
    const properties = await query;
    
    // Count total properties
    const countQuery = db.select({ count: db.fn.count() })
      .from(schema.properties);
      
    // Add conditions to count query if any
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    
    const [{ count }] = await countQuery;
    
    res.json({
      data: properties,
      pagination: {
        total: Number(count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(count) / limit)
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
    const { id } = req.params;
    
    // Get property
    const [property] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, id));
      
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get property images
    const images = await db.select()
      .from(schema.propertyImages)
      .where(eq(schema.propertyImages.propertyId, id))
      .orderBy(schema.propertyImages.sortOrder);
    
    res.json({
      ...property,
      images
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create property
app.post('/properties', async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Basic validation
    if (!propertyData.address || !propertyData.city || !propertyData.state || !propertyData.zipCode) {
      return res.status(400).json({ error: 'Missing required property fields' });
    }
    
    // Create property
    const [newProperty] = await db.insert(schema.properties)
      .values(propertyData)
      .returning();
    
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property
app.put('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;
    
    // Update property
    const [updatedProperty] = await db.update(schema.properties)
      .set({
        ...propertyData,
        updatedAt: new Date()
      })
      .where(eq(schema.properties.id, id))
      .returning();
    
    if (!updatedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
app.delete('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if property is used in any reports
    const reports = await db.select({ count: db.fn.count() })
      .from(schema.appraisalReports)
      .where(eq(schema.appraisalReports.propertyId, id));
      
    const [{ count }] = reports;
    
    if (Number(count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete property that is referenced by reports',
        reportsCount: Number(count)
      });
    }
    
    // Delete property images first
    await db.delete(schema.propertyImages)
      .where(eq(schema.propertyImages.propertyId, id));
    
    // Delete property
    const [deletedProperty] = await db.delete(schema.properties)
      .where(eq(schema.properties.id, id))
      .returning();
    
    if (!deletedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json({
      message: 'Property deleted successfully',
      property: deletedProperty
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Add property image
app.post('/properties/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const { url, caption, type = 'exterior', sortOrder = 0 } = req.body;
    
    // Basic validation
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // Check if property exists
    const [property] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, id));
      
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Add image
    const [newImage] = await db.insert(schema.propertyImages)
      .values({
        propertyId: id,
        url,
        caption,
        type,
        sortOrder
      })
      .returning();
    
    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error adding property image:', error);
    res.status(500).json({ error: 'Failed to add property image' });
  }
});

// Delete property image
app.delete('/properties/:propertyId/images/:imageId', async (req, res) => {
  try {
    const { propertyId, imageId } = req.params;
    
    // Delete image
    const [deletedImage] = await db.delete(schema.propertyImages)
      .where(
        and(
          eq(schema.propertyImages.id, imageId),
          eq(schema.propertyImages.propertyId, propertyId)
        )
      )
      .returning();
    
    if (!deletedImage) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({
      message: 'Image deleted successfully',
      image: deletedImage
    });
  } catch (error) {
    console.error('Error deleting property image:', error);
    res.status(500).json({ error: 'Failed to delete property image' });
  }
});

// Get property statistics
app.get('/properties/stats/summary', async (req, res) => {
  try {
    // Total property count
    const [{ count: totalCount }] = await db.select({ count: db.fn.count() })
      .from(schema.properties);
    
    // Count by property type
    const propertyTypeCounts = await db.select({
      type: schema.properties.propertyType,
      count: db.fn.count()
    })
    .from(schema.properties)
    .groupBy(schema.properties.propertyType);
    
    // Count by state
    const stateCounts = await db.select({
      state: schema.properties.state,
      count: db.fn.count()
    })
    .from(schema.properties)
    .groupBy(schema.properties.state)
    .orderBy(desc(db.fn.count()));
    
    // Average square feet by property type
    const avgSqftByType = await db.select({
      type: schema.properties.propertyType,
      avgSqft: db.fn.avg(schema.properties.squareFeet)
    })
    .from(schema.properties)
    .groupBy(schema.properties.propertyType);
    
    // Properties added in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [{ count: recentCount }] = await db.select({ count: db.fn.count() })
      .from(schema.properties)
      .where(schema.properties.createdAt >= thirtyDaysAgo);
    
    res.json({
      totalProperties: Number(totalCount),
      byPropertyType: propertyTypeCounts.map(item => ({
        type: item.type,
        count: Number(item.count)
      })),
      byState: stateCounts.slice(0, 5).map(item => ({
        state: item.state,
        count: Number(item.count)
      })),
      averageSqftByType: avgSqftByType.map(item => ({
        type: item.type,
        averageSqft: Math.round(Number(item.avgSqft))
      })),
      recentlyAdded: Number(recentCount)
    });
  } catch (error) {
    console.error('Error fetching property statistics:', error);
    res.status(500).json({ error: 'Failed to fetch property statistics' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property service running on port ${PORT}`);
});

export default app;