/**
 * TerraFusionPro Property Service
 * 
 * This service handles property data management, storage, and retrieval.
 * It provides APIs for CRUD operations on property records, including
 * addressing, characteristics, images, and related metadata.
 */

import http from 'http';
import { URL } from 'url';
import { properties, propertyImages } from '../../packages/shared/schema/index.js';
import storageModule from '../../packages/shared/storage.js';

// Destructure the storage module for easier access
const { db, create, find, findById, update, remove } = storageModule;

// Service configuration
const PORT = process.env.SERVICE_PORT || 5001;
const SERVICE_NAME = 'property-service';

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Role, X-User-Email');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse user information from headers (set by API Gateway)
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  
  // Handle health check (used for liveness probe)
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: SERVICE_NAME,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    // Get request body for POST and PUT requests
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT') {
      await new Promise((resolve) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
      });
    }
    
    // Parse JSON body if content-type is application/json
    let data = {};
    if (body && req.headers['content-type'] === 'application/json') {
      try {
        data = JSON.parse(body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }
    }
    
    // Properties endpoints
    if (path === '/properties' || path.startsWith('/properties/')) {
      
      // Get all properties
      if (req.method === 'GET' && path === '/properties') {
        // Parse query parameters
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        const sortBy = url.searchParams.get('sortBy') || 'id';
        const sortOrder = url.searchParams.get('sortOrder') || 'asc';
        
        // Filter properties based on query parameters
        const filters = {};
        if (url.searchParams.has('propertyType')) {
          filters.propertyType = url.searchParams.get('propertyType');
        }
        if (url.searchParams.has('city')) {
          filters.city = url.searchParams.get('city');
        }
        if (url.searchParams.has('state')) {
          filters.state = url.searchParams.get('state');
        }
        
        try {
          // Find properties with filters, limit, offset, and ordering
          const propertyList = await find(properties, filters, {
            limit,
            offset,
            orderBy: {
              [sortBy]: sortOrder
            }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            properties: propertyList,
            total: propertyList.length, // In a real app, this would be the total count without limit
            limit,
            offset
          }));
        } catch (error) {
          console.error('Error fetching properties:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching properties' }));
        }
        return;
      }
      
      // Get property by ID
      if (req.method === 'GET' && path.match(/^\/properties\/\d+$/)) {
        const propertyId = parseInt(path.split('/')[2]);
        
        try {
          const property = await findById(properties, propertyId);
          
          if (!property) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Property not found' }));
            return;
          }
          
          // Get property images
          const propertyImagesList = await find(propertyImages, { propertyId }, {
            orderBy: { sortOrder: 'asc' }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            ...property,
            images: propertyImagesList
          }));
        } catch (error) {
          console.error('Error fetching property:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching property' }));
        }
        return;
      }
      
      // Create property
      if (req.method === 'POST' && path === '/properties') {
        try {
          // Validate required fields
          const requiredFields = ['address', 'city', 'state', 'zipCode', 'propertyType'];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Set creation metadata
          const propertyData = {
            ...data,
            createdBy: userId || null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create property
          const newProperty = await create(properties, propertyData);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newProperty));
        } catch (error) {
          console.error('Error creating property:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error creating property' }));
        }
        return;
      }
      
      // Update property
      if (req.method === 'PUT' && path.match(/^\/properties\/\d+$/)) {
        const propertyId = parseInt(path.split('/')[2]);
        
        try {
          // Check if property exists
          const existingProperty = await findById(properties, propertyId);
          
          if (!existingProperty) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Property not found' }));
            return;
          }
          
          // Set update metadata
          const propertyData = {
            ...data,
            updatedAt: new Date()
          };
          
          // Update property
          const updatedProperty = await update(properties, propertyId, propertyData);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedProperty));
        } catch (error) {
          console.error('Error updating property:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error updating property' }));
        }
        return;
      }
      
      // Delete property
      if (req.method === 'DELETE' && path.match(/^\/properties\/\d+$/)) {
        const propertyId = parseInt(path.split('/')[2]);
        
        try {
          // Check if property exists
          const existingProperty = await findById(properties, propertyId);
          
          if (!existingProperty) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Property not found' }));
            return;
          }
          
          // Delete property
          await remove(properties, propertyId);
          
          res.writeHead(204);
          res.end();
        } catch (error) {
          console.error('Error deleting property:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error deleting property' }));
        }
        return;
      }
      
      // Property images endpoints
      if (path === '/properties/:id/images' || path.match(/^\/properties\/\d+\/images(\/\d+)?$/)) {
        const propertyId = parseInt(path.split('/')[2]);
        const imageId = path.split('/')[4] ? parseInt(path.split('/')[4]) : null;
        
        // Get property images
        if (req.method === 'GET' && !imageId) {
          try {
            // Check if property exists
            const existingProperty = await findById(properties, propertyId);
            
            if (!existingProperty) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Property not found' }));
              return;
            }
            
            // Get property images
            const propertyImagesList = await find(propertyImages, { propertyId }, {
              orderBy: { sortOrder: 'asc' }
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ images: propertyImagesList }));
          } catch (error) {
            console.error('Error fetching property images:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error fetching property images' }));
          }
          return;
        }
        
        // Get property image by ID
        if (req.method === 'GET' && imageId) {
          try {
            // Check if property exists
            const existingProperty = await findById(properties, propertyId);
            
            if (!existingProperty) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Property not found' }));
              return;
            }
            
            // Get property image
            const image = await findById(propertyImages, imageId);
            
            if (!image || image.propertyId !== propertyId) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Image not found' }));
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(image));
          } catch (error) {
            console.error('Error fetching property image:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error fetching property image' }));
          }
          return;
        }
        
        // Add property image
        if (req.method === 'POST' && !imageId) {
          try {
            // Check if property exists
            const existingProperty = await findById(properties, propertyId);
            
            if (!existingProperty) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Property not found' }));
              return;
            }
            
            // Validate required fields
            if (!data.url) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Image URL is required' }));
              return;
            }
            
            // Set image metadata
            const imageData = {
              propertyId,
              url: data.url,
              caption: data.caption || null,
              type: data.type || 'exterior',
              isPrimary: data.isPrimary || false,
              sortOrder: data.sortOrder || 0,
              uploadedBy: userId || null,
              uploadedAt: new Date()
            };
            
            // Create image
            const newImage = await create(propertyImages, imageData);
            
            // If this is the primary image and isPrimary is true,
            // update all other images for this property to not be primary
            if (newImage.isPrimary) {
              await db.update(propertyImages)
                .set({ isPrimary: false })
                .where({ propertyId, id: { notEquals: newImage.id } });
            }
            
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newImage));
          } catch (error) {
            console.error('Error adding property image:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error adding property image' }));
          }
          return;
        }
        
        // Update property image
        if (req.method === 'PUT' && imageId) {
          try {
            // Check if property exists
            const existingProperty = await findById(properties, propertyId);
            
            if (!existingProperty) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Property not found' }));
              return;
            }
            
            // Check if image exists
            const existingImage = await findById(propertyImages, imageId);
            
            if (!existingImage || existingImage.propertyId !== propertyId) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Image not found' }));
              return;
            }
            
            // Update image
            const updatedImage = await update(propertyImages, imageId, data);
            
            // If this is the primary image and isPrimary is true,
            // update all other images for this property to not be primary
            if (updatedImage.isPrimary) {
              await db.update(propertyImages)
                .set({ isPrimary: false })
                .where({ propertyId, id: { notEquals: imageId } });
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedImage));
          } catch (error) {
            console.error('Error updating property image:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error updating property image' }));
          }
          return;
        }
        
        // Delete property image
        if (req.method === 'DELETE' && imageId) {
          try {
            // Check if property exists
            const existingProperty = await findById(properties, propertyId);
            
            if (!existingProperty) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Property not found' }));
              return;
            }
            
            // Check if image exists
            const existingImage = await findById(propertyImages, imageId);
            
            if (!existingImage || existingImage.propertyId !== propertyId) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Image not found' }));
              return;
            }
            
            // Delete image
            await remove(propertyImages, imageId);
            
            res.writeHead(204);
            res.end();
          } catch (error) {
            console.error('Error deleting property image:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error deleting property image' }));
          }
          return;
        }
      }
    }
    
    // Property statistics endpoint
    if (path === '/statistics') {
      if (req.method === 'GET') {
        try {
          // Get property counts by type
          const propertyTypeStats = await db.query.properties.groupBy('propertyType').count();
          
          // Get average values
          const averageValues = await db.select({
            avgBuildingSize: db.fn.avg(properties.buildingSize),
            avgBedrooms: db.fn.avg(properties.bedrooms),
            avgBathrooms: db.fn.avg(properties.bathrooms),
            avgYearBuilt: db.fn.avg(properties.yearBuilt)
          }).from(properties);
          
          // Get property counts by state
          const stateStats = await db.query.properties.groupBy('state').count();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            totalProperties: propertyTypeStats.reduce((sum, stat) => sum + stat._count, 0),
            byType: propertyTypeStats.reduce((acc, stat) => {
              acc[stat.propertyType] = stat._count;
              return acc;
            }, {}),
            byState: stateStats.reduce((acc, stat) => {
              acc[stat.state] = stat._count;
              return acc;
            }, {}),
            averages: averageValues[0]
          }));
        } catch (error) {
          console.error('Error fetching property statistics:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching property statistics' }));
        }
        return;
      }
    }
    
    // If no endpoint matched, return 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (error) {
    console.error('Unhandled error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Initialize database and start server
storageModule.initializeDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Property service running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down property service...');
  await storageModule.closeDatabase();
  server.close(() => {
    console.log('Property service shut down complete');
    process.exit(0);
  });
});

export default server;