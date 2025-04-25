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
import { eq, and, like, desc } from 'drizzle-orm';

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

// Get all properties with pagination
app.get('/properties', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, city, state } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let conditions = [];
    
    if (type) {
      conditions.push(eq(schema.properties.propertyType, type));
    }
    
    if (city) {
      conditions.push(like(schema.properties.city, `%${city}%`));
    }
    
    if (state) {
      conditions.push(eq(schema.properties.state, state));
    }
    
    // Execute query with conditions
    const query = conditions.length > 0
      ? db.select().from(schema.properties)
          .where(and(...conditions))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(schema.properties.createdAt))
      : db.select().from(schema.properties)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(schema.properties.createdAt));
          
    const properties = await query;
    
    // Count total for pagination
    const countQuery = conditions.length > 0
      ? db.select({ count: db.fn.count() }).from(schema.properties).where(and(...conditions))
      : db.select({ count: db.fn.count() }).from(schema.properties);
      
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
      .where(eq(schema.propertyImages.propertyId, id));
    
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
    
    // Insert property
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
    
    // Delete associated images first (foreign key constraint)
    await db.delete(schema.propertyImages)
      .where(eq(schema.propertyImages.propertyId, id));
    
    // Delete property
    const [deletedProperty] = await db.delete(schema.properties)
      .where(eq(schema.properties.id, id))
      .returning();
    
    if (!deletedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Add property image
app.post('/properties/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const imageData = req.body;
    
    // Verify property exists
    const [property] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, id));
      
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Insert image
    const [newImage] = await db.insert(schema.propertyImages)
      .values({
        ...imageData,
        propertyId: id
      })
      .returning();
    
    res.status(201).json(newImage);
  } catch (error) {
    console.error('Error adding property image:', error);
    res.status(500).json({ error: 'Failed to add property image' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property service running on port ${PORT}`);
});

export default app;