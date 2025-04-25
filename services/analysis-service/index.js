/**
 * TerraFusionPro Analysis Service
 * 
 * This service handles property valuation analysis, comparable selection,
 * and market trend calculations.
 */

import http from 'http';
import { URL } from 'url';
import { comparables, properties, marketData } from '../../packages/shared/schema/index.js';
import storageModule from '../../packages/shared/storage.js';
import { runAgent } from '../../packages/agents/index.js';

// Destructure the storage module for easier access
const { db, create, find, findById, update, remove } = storageModule;

// Service configuration
const PORT = process.env.SERVICE_PORT || 5003;
const SERVICE_NAME = 'analysis-service';

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
    
    // Comparable endpoints
    if (path.startsWith('/comparables')) {
      
      // Get all comparables for a report
      if (req.method === 'GET' && path.match(/^\/comparables\/report\/\d+$/)) {
        const reportId = parseInt(path.split('/')[3]);
        
        try {
          // Find comparables for the report
          const comparableList = await find(comparables, { reportId }, {
            orderBy: { similarityScore: 'desc' }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            comparables: comparableList
          }));
        } catch (error) {
          console.error('Error fetching comparables:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching comparables' }));
        }
        return;
      }
      
      // Get comparable by ID
      if (req.method === 'GET' && path.match(/^\/comparables\/\d+$/)) {
        const comparableId = parseInt(path.split('/')[2]);
        
        try {
          const comparable = await findById(comparables, comparableId);
          
          if (!comparable) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Comparable not found' }));
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(comparable));
        } catch (error) {
          console.error('Error fetching comparable:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching comparable' }));
        }
        return;
      }
      
      // Add comparable to report
      if (req.method === 'POST' && path === '/comparables') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required fields
          const requiredFields = [
            'reportId', 'address', 'city', 'state', 'zipCode', 
            'propertyType', 'salePrice', 'saleDate'
          ];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Set comparable data
          const comparableData = {
            ...data,
            addedBy: userId,
            addedAt: new Date()
          };
          
          // Create comparable
          const newComparable = await create(comparables, comparableData);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newComparable));
        } catch (error) {
          console.error('Error adding comparable:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error adding comparable' }));
        }
        return;
      }
      
      // Update comparable
      if (req.method === 'PUT' && path.match(/^\/comparables\/\d+$/)) {
        const comparableId = parseInt(path.split('/')[2]);
        
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Check if comparable exists
          const existingComparable = await findById(comparables, comparableId);
          
          if (!existingComparable) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Comparable not found' }));
            return;
          }
          
          // Update comparable
          const updatedComparable = await update(comparables, comparableId, data);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedComparable));
        } catch (error) {
          console.error('Error updating comparable:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error updating comparable' }));
        }
        return;
      }
      
      // Delete comparable
      if (req.method === 'DELETE' && path.match(/^\/comparables\/\d+$/)) {
        const comparableId = parseInt(path.split('/')[2]);
        
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Check if comparable exists
          const existingComparable = await findById(comparables, comparableId);
          
          if (!existingComparable) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Comparable not found' }));
            return;
          }
          
          // Delete comparable
          await remove(comparables, comparableId);
          
          res.writeHead(204);
          res.end();
        } catch (error) {
          console.error('Error deleting comparable:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error deleting comparable' }));
        }
        return;
      }
    }
    
    // Market data endpoints
    if (path.startsWith('/market')) {
      
      // Get market data
      if (req.method === 'GET' && path === '/market/data') {
        try {
          // Parse query parameters
          const location = url.searchParams.get('location');
          const propertyType = url.searchParams.get('propertyType');
          const period = url.searchParams.get('period');
          
          // Validate required parameters
          if (!location) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Location parameter is required' }));
            return;
          }
          
          // Build filter
          const filter = { location };
          if (propertyType) {
            filter.propertyType = propertyType;
          }
          if (period) {
            filter.period = period;
          }
          
          // Find market data
          const marketDataList = await find(marketData, filter, {
            orderBy: { updateDate: 'desc' }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ marketData: marketDataList }));
        } catch (error) {
          console.error('Error fetching market data:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching market data' }));
        }
        return;
      }
      
      // Generate market analysis
      if (req.method === 'POST' && path === '/market/analyze') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required fields
          if (!data.location) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Location is required' }));
            return;
          }
          
          if (!data.salesData || !Array.isArray(data.salesData)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Sales data is required and must be an array' }));
            return;
          }
          
          // Run market analyzer agent
          const analysisResults = await runAgent('market-analyzer', {
            location: data.location,
            salesData: data.salesData,
            timeframe: data.timeframe || 12 // Default to 12 months
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(analysisResults));
        } catch (error) {
          console.error('Error generating market analysis:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error generating market analysis' }));
        }
        return;
      }
    }
    
    // Valuation endpoints
    if (path.startsWith('/valuation')) {
      
      // Find comparable properties
      if (req.method === 'POST' && path === '/valuation/find-comps') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required data
          if (!data.subject) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Subject property data is required' }));
            return;
          }
          
          // Get parameters for the search
          const propertyType = data.subject.propertyType;
          const city = data.subject.city;
          const state = data.subject.state;
          const zipCode = data.subject.zipCode;
          const reportId = data.reportId;
          
          // Build filter for finding potential comparables
          const filter = {
            propertyType
          };
          
          // Add location filters with some flexibility
          // Can use either city, state, or zipCode as a filter
          if (zipCode) {
            filter.zipCode = zipCode;
          } else if (city && state) {
            filter.city = city;
            filter.state = state;
          }
          
          // Find potential comparable properties
          let potentialComparables;
          
          // If we have a report ID, we'll use existing comparables
          if (reportId) {
            potentialComparables = await find(comparables, { reportId });
          } else {
            // Get a sample of properties that match our criteria
            potentialComparables = await find(properties, filter, {
              limit: 50
            });
          }
          
          // Run comp selector agent
          const selectionResults = await runAgent('comp-selector', {
            subject: data.subject,
            comparables: potentialComparables,
            // Additional parameters
            reportId: data.reportId,
            maxResults: data.maxResults || 10
          }, {
            // Agent options
            weights: data.weights
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(selectionResults));
        } catch (error) {
          console.error('Error finding comparable properties:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error finding comparable properties' }));
        }
        return;
      }
      
      // Calculate adjustments for a comparable property
      if (req.method === 'POST' && path === '/valuation/calculate-adjustments') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required data
          if (!data.subject || !data.comparable) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Subject and comparable property data are required' }));
            return;
          }
          
          // Calculate adjustments
          const adjustments = generateAdjustments(data.subject, data.comparable);
          
          // Calculate adjusted price
          const adjustedPrice = data.comparable.salePrice + 
            Object.values(adjustments).reduce((sum, val) => sum + val, 0);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            adjustments,
            adjustedPrice,
            originalPrice: data.comparable.salePrice
          }));
        } catch (error) {
          console.error('Error calculating adjustments:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error calculating adjustments' }));
        }
        return;
      }
      
      // Data validation
      if (req.method === 'POST' && path === '/valuation/validate-data') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Run data validator agent
          const validationResults = await runAgent('data-validator', data);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(validationResults));
        } catch (error) {
          console.error('Error validating data:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error validating data' }));
        }
        return;
      }
      
      // Quality control check
      if (req.method === 'POST' && path === '/valuation/quality-check') {
        // Check if user is authenticated and has appropriate role
        if (!userId || (userRole !== 'admin' && userRole !== 'reviewer')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required data
          if (!data.report) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report data is required' }));
            return;
          }
          
          // Run QC reviewer agent
          const qcResults = await runAgent('qc-reviewer', data);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(qcResults));
        } catch (error) {
          console.error('Error performing quality check:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error performing quality check' }));
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

/**
 * Calculate adjustments between subject and comparable properties
 * @param {Object} subject - Subject property
 * @param {Object} comp - Comparable property
 * @returns {Object} - Adjustments by category
 */
function generateAdjustments(subject, comp) {
  const adjustments = {};
  
  // Size adjustment
  if (subject.buildingSize && comp.buildingSize) {
    const subjectSize = parseFloat(subject.buildingSize);
    const compSize = parseFloat(comp.buildingSize);
    
    if (!isNaN(subjectSize) && !isNaN(compSize)) {
      const sizeDiff = subjectSize - compSize;
      if (Math.abs(sizeDiff) > 0) {
        // Assume $100 per square foot adjustment
        adjustments.buildingSize = Math.round(sizeDiff * 100);
      }
    }
  }
  
  // Bedroom adjustment
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = subject.bedrooms - comp.bedrooms;
    if (bedroomDiff !== 0) {
      // Assume $5,000 per bedroom
      adjustments.bedrooms = bedroomDiff * 5000;
    }
  }
  
  // Bathroom adjustment
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = subject.bathrooms - comp.bathrooms;
    if (bathroomDiff !== 0) {
      // Assume $7,500 per bathroom
      adjustments.bathrooms = bathroomDiff * 7500;
    }
  }
  
  // Age adjustment
  if (subject.yearBuilt && comp.yearBuilt) {
    const ageDiff = subject.yearBuilt - comp.yearBuilt;
    if (Math.abs(ageDiff) > 5) {
      // Assume $1,000 per year of age difference beyond 5 years
      adjustments.age = (ageDiff > 5 ? ageDiff - 5 : ageDiff + 5) * 1000;
    }
  }
  
  // Lot size adjustment
  if (subject.lotSize && comp.lotSize) {
    const subjectLot = parseFloat(subject.lotSize);
    const compLot = parseFloat(comp.lotSize);
    
    if (!isNaN(subjectLot) && !isNaN(compLot)) {
      const lotDiff = subjectLot - compLot;
      if (Math.abs(lotDiff) > 0) {
        // Assume $2 per square foot for lot size difference
        adjustments.lotSize = Math.round(lotDiff * 2);
      }
    }
  }
  
  // Garage/parking adjustment
  if (subject.parkingSpaces && comp.parkingSpaces) {
    const parkingDiff = subject.parkingSpaces - comp.parkingSpaces;
    if (parkingDiff !== 0) {
      // Assume $5,000 per parking space
      adjustments.parking = parkingDiff * 5000;
    }
  }
  
  return adjustments;
}

/**
 * Calculate market metrics from property data
 * @param {Array} properties - Property data
 * @param {Date} startDate - Start date for analysis period
 * @param {Date} endDate - End date for analysis period
 * @returns {Object} - Market metrics
 */
function calculateMarketMetrics(properties, startDate, endDate) {
  // Extract prices
  const prices = properties.map(property => property.salePrice).filter(price => !isNaN(price));
  
  // Bail out if no valid prices
  if (prices.length === 0) {
    return {
      count: 0,
      avgPrice: 0,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      avgDaysOnMarket: 0
    };
  }
  
  // Sort prices for median calculation
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // Calculate median price
  const middle = Math.floor(sortedPrices.length / 2);
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[middle - 1] + sortedPrices[middle]) / 2
    : sortedPrices[middle];
  
  // Calculate days on market
  const daysOnMarket = properties
    .map(property => property.daysOnMarket)
    .filter(days => !isNaN(days));
  
  const avgDaysOnMarket = daysOnMarket.length > 0
    ? Math.round(daysOnMarket.reduce((sum, days) => sum + days, 0) / daysOnMarket.length)
    : 0;
  
  return {
    count: prices.length,
    avgPrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    medianPrice: Math.round(medianPrice),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgDaysOnMarket
  };
}

/**
 * Analyze market trends from metrics
 * @param {Object} metrics - Market metrics
 * @param {number} timeframe - Timeframe in months
 * @returns {Object} - Market trends
 */
function analyzeMarketTrends(metrics, timeframe) {
  // This is a simplified version for demonstration
  // In a real implementation, we would compare current metrics to historical data
  
  // Simulate a trend based on metrics
  const trendScore = Math.min(10, Math.max(0, 10 - metrics.avgDaysOnMarket / 10));
  
  // Determine trend direction
  let trend;
  if (trendScore > 7) {
    trend = 'Strong growth';
  } else if (trendScore > 5) {
    trend = 'Moderate growth';
  } else if (trendScore > 3) {
    trend = 'Stable';
  } else if (trendScore > 1) {
    trend = 'Slight decline';
  } else {
    trend = 'Significant decline';
  }
  
  // Simulated price change based on trend score
  const priceChange = (trendScore - 5) * (metrics.avgPrice * 0.02);
  const percentChange = priceChange / metrics.avgPrice * 100;
  
  // Simulated DOM change based on trend score (inverse relationship)
  const daysOnMarketChange = (5 - trendScore) * 2;
  
  // Simulated inventory change based on trend score (inverse relationship)
  const inventoryChange = (5 - trendScore) * 3;
  
  return {
    priceChange: Math.round(priceChange),
    percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal place
    daysOnMarketChange: Math.round(daysOnMarketChange),
    inventoryChange: Math.round(inventoryChange),
    trend
  };
}

/**
 * Assess market conditions from metrics and trends
 * @param {Object} metrics - Market metrics
 * @param {Object} trends - Market trends
 * @returns {Object} - Market conditions
 */
function assessMarketConditions(metrics, trends) {
  // Determine market type
  let marketType;
  if (trends.percentChange > 8 && metrics.avgDaysOnMarket < 30) {
    marketType = 'Hot Seller\'s Market';
  } else if (trends.percentChange > 3 && metrics.avgDaysOnMarket < 45) {
    marketType = 'Seller\'s Market';
  } else if (trends.percentChange > -3 && trends.percentChange <= 3) {
    marketType = 'Balanced Market';
  } else if (trends.percentChange > -8 && metrics.avgDaysOnMarket < 90) {
    marketType = 'Buyer\'s Market';
  } else {
    marketType = 'Strong Buyer\'s Market';
  }
  
  // Determine demand level
  let demand;
  if (metrics.avgDaysOnMarket < 30) {
    demand = 'Very Strong';
  } else if (metrics.avgDaysOnMarket < 45) {
    demand = 'Strong';
  } else if (metrics.avgDaysOnMarket < 60) {
    demand = 'Moderate';
  } else if (metrics.avgDaysOnMarket < 90) {
    demand = 'Weak';
  } else {
    demand = 'Very Weak';
  }
  
  // Determine price trend
  let priceDirection;
  if (trends.percentChange > 8) {
    priceDirection = 'Rising Rapidly';
  } else if (trends.percentChange > 2) {
    priceDirection = 'Rising';
  } else if (trends.percentChange >= -2) {
    priceDirection = 'Stable';
  } else if (trends.percentChange >= -8) {
    priceDirection = 'Declining';
  } else {
    priceDirection = 'Declining Rapidly';
  }
  
  // Determine overall condition
  const overall = getOverallCondition(marketType, demand, priceDirection);
  
  return {
    marketType,
    demand,
    priceDirection,
    overall
  };
}

/**
 * Determine overall market condition
 * @param {string} marketType - Market type
 * @param {string} demand - Demand level
 * @param {string} priceDirection - Price direction
 * @returns {string} - Overall condition
 */
function getOverallCondition(marketType, demand, priceDirection) {
  // Weighted scoring system for overall condition
  let score = 0;
  
  // Market type score
  if (marketType.includes('Hot Seller')) score += 5;
  else if (marketType.includes('Seller')) score += 4;
  else if (marketType.includes('Balanced')) score += 3;
  else if (marketType.includes('Buyer')) score += 2;
  else score += 1;
  
  // Demand score
  if (demand === 'Very Strong') score += 5;
  else if (demand === 'Strong') score += 4;
  else if (demand === 'Moderate') score += 3;
  else if (demand === 'Weak') score += 2;
  else score += 1;
  
  // Price direction score
  if (priceDirection === 'Rising Rapidly') score += 5;
  else if (priceDirection === 'Rising') score += 4;
  else if (priceDirection === 'Stable') score += 3;
  else if (priceDirection === 'Declining') score += 2;
  else score += 1;
  
  // Convert score to condition
  const avgScore = score / 3;
  
  if (avgScore > 4.5) return 'Excellent';
  if (avgScore > 3.5) return 'Good';
  if (avgScore > 2.5) return 'Fair';
  if (avgScore > 1.5) return 'Challenging';
  return 'Difficult';
}

/**
 * Generate market summary
 * @param {Object} location - Location information
 * @param {Object} metrics - Market metrics
 * @param {Object} conditions - Market conditions
 * @returns {string} - Market summary
 */
function generateMarketSummary(location, metrics, conditions) {
  const { city, state, zipCode } = location;
  const { avgPrice, medianPrice, avgDaysOnMarket } = metrics;
  const { marketType, demand, priceDirection, overall } = conditions;
  
  const locationString = zipCode ? `${city}, ${state} ${zipCode}` : `${city}, ${state}`;
  
  return `The ${locationString} real estate market is currently a ${marketType} with ${demand.toLowerCase()} buyer demand. 
Property values are ${priceDirection.toLowerCase()}, with an average price of ${formatCurrency(avgPrice)} and a median price of ${formatCurrency(medianPrice)}. 
The average property spends ${avgDaysOnMarket} days on the market before selling. 
Overall market conditions are ${overall.toLowerCase()}.`;
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Initialize database and start server
storageModule.initializeDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Analysis service running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down analysis service...');
  await storageModule.closeDatabase();
  server.close(() => {
    console.log('Analysis service shut down complete');
    process.exit(0);
  });
});

export default server;