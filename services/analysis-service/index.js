/**
 * TerraFusionPro Analysis Service
 * 
 * This service handles property valuation analysis, comparable selection,
 * and market trend calculations.
 */

import express from 'express';
import cors from 'cors';
import { db, schema, initializeDatabase } from '../../packages/shared/storage.js';
import { eq, and, gte, lte, between } from 'drizzle-orm';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await initializeDatabase();
    
    res.json({
      service: 'analysis-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      service: 'analysis-service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Generate comparable properties for an appraisal
app.post('/analysis/comparables', async (req, res) => {
  try {
    const { propertyId, radius = 5, maxResults = 5 } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }
    
    // Get the subject property
    const [property] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, propertyId));
      
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // In a real implementation, this would use geospatial queries to find properties within radius
    // For now, we'll just find properties with similar characteristics
    const comparableProperties = await db.select()
      .from(schema.properties)
      .where(
        and(
          // Not the same property
          eq(schema.properties.id, propertyId).not(),
          
          // Same property type
          eq(schema.properties.propertyType, property.propertyType),
          
          // Similar size (within 20%)
          property.squareFeet ? between(
            schema.properties.squareFeet,
            Math.floor(property.squareFeet * 0.8),
            Math.ceil(property.squareFeet * 1.2)
          ) : undefined,
          
          // Similar bedrooms (±1)
          property.bedrooms ? between(
            schema.properties.bedrooms,
            Math.max(1, property.bedrooms - 1),
            property.bedrooms + 1
          ) : undefined,
          
          // Similar year built (±10 years)
          property.yearBuilt ? between(
            schema.properties.yearBuilt,
            property.yearBuilt - 10,
            property.yearBuilt + 10
          ) : undefined
        )
      )
      .limit(maxResults);
    
    // Format response with adjustments (in a real implementation, these would be calculated)
    const comparables = comparableProperties.map(comp => {
      // Calculate a mock adjustment factor based on differences
      const squareFeetDiff = property.squareFeet && comp.squareFeet
        ? ((comp.squareFeet - property.squareFeet) / property.squareFeet) * 100
        : 0;
        
      const bedroomsDiff = property.bedrooms && comp.bedrooms
        ? comp.bedrooms - property.bedrooms
        : 0;
        
      const yearBuiltDiff = property.yearBuilt && comp.yearBuilt
        ? comp.yearBuilt - property.yearBuilt
        : 0;
      
      // Mock adjustments
      const adjustments = {
        squareFeet: squareFeetDiff !== 0 ? {
          difference: squareFeetDiff.toFixed(1) + '%',
          adjustment: squareFeetDiff > 0 ? -squareFeetDiff * 1000 : Math.abs(squareFeetDiff) * 1000
        } : null,
        bedrooms: bedroomsDiff !== 0 ? {
          difference: bedroomsDiff,
          adjustment: bedroomsDiff > 0 ? 15000 : -15000
        } : null,
        yearBuilt: yearBuiltDiff !== 0 ? {
          difference: yearBuiltDiff,
          adjustment: yearBuiltDiff > 0 ? 5000 * Math.min(yearBuiltDiff, 5) : -5000 * Math.min(Math.abs(yearBuiltDiff), 5)
        } : null,
        location: {
          difference: 'Similar',
          adjustment: 0
        }
      };
      
      // Calculate total adjustment
      const totalAdjustment = Object.values(adjustments)
        .filter(adj => adj !== null)
        .reduce((sum, adj) => sum + adj.adjustment, 0);
      
      // Generate a mock sale price
      const mockSalePrice = 300000 + Math.floor(Math.random() * 200000);
      
      // Calculate adjusted price
      const adjustedPrice = mockSalePrice + totalAdjustment;
      
      return {
        id: comp.id,
        address: comp.address,
        city: comp.city,
        state: comp.state,
        zipCode: comp.zipCode,
        propertyType: comp.propertyType,
        yearBuilt: comp.yearBuilt,
        squareFeet: comp.squareFeet,
        bedrooms: comp.bedrooms,
        bathrooms: comp.bathrooms,
        salePrice: mockSalePrice,
        saleDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        adjustments,
        totalAdjustment,
        adjustedPrice,
        description: `${comp.bedrooms} bed, ${comp.bathrooms} bath, ${comp.squareFeet} sqft property in ${comp.city}`
      };
    });
    
    res.json({
      subjectProperty: property,
      comparables
    });
  } catch (error) {
    console.error('Error generating comparables:', error);
    res.status(500).json({ error: 'Failed to generate comparables' });
  }
});

// Calculate estimated value for a property
app.post('/analysis/valuation', async (req, res) => {
  try {
    const { propertyId, approachType = 'sales_comparison' } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }
    
    // Get the subject property
    const [property] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, propertyId));
      
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get or generate comparables
    let comparables = [];
    
    // Check if there are existing comparables in the database
    const existingComps = await db.select()
      .from(schema.comparables)
      .where(eq(schema.comparables.reportId, req.body.reportId));
      
    if (existingComps.length > 0) {
      comparables = existingComps;
    } else {
      // Since we don't have real comparables, we'll generate mock data
      // In a real implementation, this would call the comparables endpoint
      // or use a more sophisticated valuation algorithm
      
      // Generate a base value based on property characteristics
      const baseValuePerSqFt = property.propertyType === 'residential' ? 250 : 150;
      const sizeFactor = property.squareFeet ? property.squareFeet / 1500 : 1;
      const ageFactor = property.yearBuilt ? (2025 - property.yearBuilt) / 50 : 0.5;
      const locationFactor = 1.2; // Would be based on actual location data
      
      const baseValue = property.squareFeet 
        ? Math.round(property.squareFeet * baseValuePerSqFt * locationFactor * (1 - ageFactor * 0.3))
        : 350000;
      
      // Apply adjustments for bedrooms/bathrooms
      const bedroomValue = (property.bedrooms || 3) * 25000;
      const bathroomValue = (property.bathrooms || 2) * 15000;
      
      // Calculate final value
      let estimatedValue = baseValue + bedroomValue + bathroomValue;
      
      // Add confidence interval
      const confidenceLow = Math.round(estimatedValue * 0.9);
      const confidenceHigh = Math.round(estimatedValue * 1.1);
      
      res.json({
        propertyId,
        estimatedValue,
        confidenceInterval: {
          low: confidenceLow,
          high: confidenceHigh
        },
        approachType,
        valuationDate: new Date().toISOString(),
        factors: {
          size: {
            description: `${property.squareFeet} sqft`,
            impact: 'high'
          },
          location: {
            description: `${property.city}, ${property.state}`,
            impact: 'high'
          },
          age: {
            description: property.yearBuilt ? `Built in ${property.yearBuilt}` : 'Unknown year built',
            impact: 'medium'
          },
          bedrooms: {
            description: `${property.bedrooms} bedrooms`,
            impact: 'medium'
          },
          bathrooms: {
            description: `${property.bathrooms} bathrooms`,
            impact: 'medium'
          }
        }
      });
    }
  } catch (error) {
    console.error('Error calculating valuation:', error);
    res.status(500).json({ error: 'Failed to calculate valuation' });
  }
});

// Analyze market trends for a given area
app.get('/analysis/market-trends', async (req, res) => {
  try {
    const { city, state, zipCode, period = '12months' } = req.query;
    
    // Basic validation
    if (!city && !state && !zipCode) {
      return res.status(400).json({ error: 'At least one location parameter (city, state, or zipCode) is required' });
    }
    
    // In a real implementation, this would query actual property data
    // and calculate trends based on historical sales
    
    // For now, we'll return mock data
    // In a full application, this would be replaced with real data analysis
    
    // Generate time series data for market trends
    const now = new Date();
    const months = period === '12months' ? 12 : period === '6months' ? 6 : 24;
    
    // Generate data points for median sale price
    const medianPriceData = [];
    let basePrice = 400000;
    
    for (let i = months; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Add some randomness and a slight upward trend
      const randomFactor = 0.95 + (Math.random() * 0.1);
      const trendFactor = 1 + (0.02 * (months - i) / months);
      
      basePrice = Math.round(basePrice * randomFactor * trendFactor);
      
      medianPriceData.push({
        date: date.toISOString().split('T')[0],
        value: basePrice
      });
    }
    
    // Calculate median price trends
    const firstPrice = medianPriceData[0].value;
    const lastPrice = medianPriceData[medianPriceData.length - 1].value;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    // Generate days on market data
    const daysOnMarketData = [];
    let baseDays = 45;
    
    for (let i = months; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Add some randomness and a slight downward trend (faster sales)
      const randomFactor = 0.95 + (Math.random() * 0.1);
      const trendFactor = 1 - (0.01 * (months - i) / months);
      
      baseDays = Math.round(baseDays * randomFactor * trendFactor);
      
      daysOnMarketData.push({
        date: date.toISOString().split('T')[0],
        value: baseDays
      });
    }
    
    // Calculate days on market trend
    const firstDays = daysOnMarketData[0].value;
    const lastDays = daysOnMarketData[daysOnMarketData.length - 1].value;
    const daysChange = ((lastDays - firstDays) / firstDays) * 100;
    
    res.json({
      location: {
        city,
        state,
        zipCode
      },
      period,
      analysisDate: now.toISOString(),
      medianSalePrice: {
        current: lastPrice,
        change: priceChange.toFixed(1),
        trend: priceChange > 0 ? 'increasing' : 'decreasing',
        timeSeries: medianPriceData
      },
      daysOnMarket: {
        current: lastDays,
        change: daysChange.toFixed(1),
        trend: daysChange < 0 ? 'decreasing' : 'increasing',
        timeSeries: daysOnMarketData
      },
      inventory: {
        current: Math.round(30 + Math.random() * 20),
        change: (-5 + Math.random() * 10).toFixed(1),
        trend: 'decreasing'
      },
      marketCondition: priceChange > 5 && daysChange < 0 ? 'hot' : 'stable',
      summary: `The real estate market in ${city || state || zipCode} has shown a ${priceChange > 0 ? 'positive' : 'negative'} trend over the past ${months} months, with median home prices ${priceChange > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(priceChange).toFixed(1)}% and average days on market ${daysChange < 0 ? 'decreasing' : 'increasing'} by ${Math.abs(daysChange).toFixed(1)}%.`
    });
  } catch (error) {
    console.error('Error analyzing market trends:', error);
    res.status(500).json({ error: 'Failed to analyze market trends' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analysis service running on port ${PORT}`);
});

export default app;