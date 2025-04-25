/**
 * TerraFusionPro Analysis Service
 * 
 * This service handles property valuation analysis, comparable selection,
 * and market trend calculations.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../../packages/shared/storage.js';
import { 
  properties, 
  comparables,
  appraisalReports
} from '../../packages/shared/schema/index.js';
import { eq, and, desc, sql, gte, lte, like, between } from 'drizzle-orm';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.ANALYSIS_SERVICE_PORT || 5003;

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
    service: 'analysis-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Find comparable properties
app.post('/comparables/find', async (req, res) => {
  try {
    const { 
      propertyId, 
      reportId, 
      radius = 5,
      maxResults = 10, 
      minSimilarity = 0.5,
      filters = {}
    } = req.body;
    
    // Validate required fields
    if (!propertyId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['propertyId']
      });
    }
    
    // Get subject property details
    const subjectProperty = await db.select()
      .from(properties)
      .where(eq(properties.id, Number(propertyId)))
      .limit(1);
      
    if (subjectProperty.length === 0) {
      return res.status(404).json({ error: 'Subject property not found' });
    }
    
    // Build location-based query
    // In a real implementation, this would use geospatial queries
    // For this example, we'll simplify and just filter by city and state
    const baseQuery = db.select()
      .from(properties)
      .where(
        and(
          eq(properties.city, subjectProperty[0].city),
          eq(properties.state, subjectProperty[0].state),
          sql`${properties.id} != ${propertyId}`
        )
      );
    
    // Apply additional filters
    if (filters.propertyType) {
      baseQuery.where(eq(properties.propertyType, filters.propertyType));
    }
    
    if (filters.minBedrooms) {
      baseQuery.where(gte(properties.bedrooms, filters.minBedrooms));
    }
    
    if (filters.maxBedrooms) {
      baseQuery.where(lte(properties.bedrooms, filters.maxBedrooms));
    }
    
    if (filters.minBathrooms) {
      baseQuery.where(gte(properties.bathrooms, filters.minBathrooms));
    }
    
    if (filters.maxBathrooms) {
      baseQuery.where(lte(properties.bathrooms, filters.maxBathrooms));
    }
    
    if (filters.minYearBuilt) {
      baseQuery.where(gte(properties.yearBuilt, filters.minYearBuilt));
    }
    
    if (filters.maxYearBuilt) {
      baseQuery.where(lte(properties.yearBuilt, filters.maxYearBuilt));
    }
    
    // Execute query
    const potentialComps = await baseQuery;
    
    // Calculate similarity scores
    const subject = subjectProperty[0];
    const compsWithScores = potentialComps.map(comp => {
      const scores = {
        location: calculateLocationScore(subject, comp),
        size: calculateSizeScore(subject, comp),
        age: calculateAgeScore(subject, comp),
        features: calculateFeatureScore(subject, comp)
      };
      
      // Overall similarity is a weighted average
      const weightedScore = (
        scores.location * 0.35 + 
        scores.size * 0.25 + 
        scores.age * 0.2 + 
        scores.features * 0.2
      );
      
      return {
        ...comp,
        similarity: {
          overall: weightedScore,
          scores
        },
        adjustments: generateAdjustments(subject, comp)
      };
    });
    
    // Filter by minimum similarity
    const filteredComps = compsWithScores
      .filter(comp => comp.similarity.overall >= minSimilarity)
      .sort((a, b) => b.similarity.overall - a.similarity.overall)
      .slice(0, maxResults);
    
    // If a report ID was provided, save these as comparables
    if (reportId) {
      const existingReport = await db.select({ id: appraisalReports.id })
        .from(appraisalReports)
        .where(eq(appraisalReports.id, Number(reportId)))
        .limit(1);
      
      if (existingReport.length > 0) {
        // Save comparables to database
        for (const comp of filteredComps) {
          await db.insert(comparables)
            .values({
              reportId: Number(reportId),
              propertyId: comp.id,
              address: comp.address,
              city: comp.city,
              state: comp.state,
              zipCode: comp.zipCode,
              propertyType: comp.propertyType,
              yearBuilt: comp.yearBuilt,
              lotSize: comp.lotSize,
              buildingSize: comp.buildingSize,
              bedrooms: comp.bedrooms,
              bathrooms: comp.bathrooms,
              adjustments: comp.adjustments,
              similarityScore: comp.similarity.overall.toFixed(2),
              createdAt: new Date()
            })
            .onConflictDoNothing();
        }
      }
    }
    
    res.json({
      subjectProperty: subject,
      comparables: filteredComps
    });
  } catch (error) {
    console.error('Error finding comparables:', error);
    res.status(500).json({ error: 'Failed to find comparable properties' });
  }
});

// Calculate location-based similarity score
function calculateLocationScore(subject, comp) {
  // In a real implementation, this would use geocoding and distance calculations
  // For this example, we'll use a simplified approach
  
  // Same city and state is a base score of 0.7
  let score = 0.7;
  
  // Same zip code adds 0.2
  if (subject.zipCode === comp.zipCode) {
    score += 0.2;
  }
  
  // For the remaining 0.1, we would normally use actual distance
  // Here we'll just add a random factor to simulate variations within a city
  score += Math.random() * 0.1;
  
  return Math.min(score, 1.0);
}

// Calculate size-based similarity score
function calculateSizeScore(subject, comp) {
  let score = 1.0;
  
  // Building size difference
  if (subject.buildingSize && comp.buildingSize) {
    const subjectSize = parseFloat(subject.buildingSize);
    const compSize = parseFloat(comp.buildingSize);
    
    if (!isNaN(subjectSize) && !isNaN(compSize) && subjectSize > 0) {
      const sizeDiff = Math.abs(subjectSize - compSize) / subjectSize;
      // Deduct points based on size difference percentage
      if (sizeDiff > 0.3) {
        score -= 0.5;
      } else if (sizeDiff > 0.2) {
        score -= 0.3;
      } else if (sizeDiff > 0.1) {
        score -= 0.1;
      }
    }
  }
  
  // Bedrooms difference
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = Math.abs(subject.bedrooms - comp.bedrooms);
    if (bedroomDiff >= 2) {
      score -= 0.2;
    } else if (bedroomDiff === 1) {
      score -= 0.1;
    }
  }
  
  // Bathrooms difference
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = Math.abs(subject.bathrooms - comp.bathrooms);
    if (bathroomDiff >= 2) {
      score -= 0.2;
    } else if (bathroomDiff === 1) {
      score -= 0.1;
    }
  }
  
  // Lot size difference
  if (subject.lotSize && comp.lotSize) {
    const subjectLot = parseFloat(subject.lotSize);
    const compLot = parseFloat(comp.lotSize);
    
    if (!isNaN(subjectLot) && !isNaN(compLot) && subjectLot > 0) {
      const lotDiff = Math.abs(subjectLot - compLot) / subjectLot;
      if (lotDiff > 0.5) {
        score -= 0.2;
      } else if (lotDiff > 0.25) {
        score -= 0.1;
      }
    }
  }
  
  return Math.max(score, 0.0);
}

// Calculate age-based similarity score
function calculateAgeScore(subject, comp) {
  if (!subject.yearBuilt || !comp.yearBuilt) {
    return 0.5; // Default middle score if we don't have age data
  }
  
  const ageDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
  
  if (ageDiff <= 5) {
    return 1.0;
  } else if (ageDiff <= 10) {
    return 0.8;
  } else if (ageDiff <= 20) {
    return 0.6;
  } else if (ageDiff <= 30) {
    return 0.4;
  } else {
    return 0.2;
  }
}

// Calculate feature-based similarity score
function calculateFeatureScore(subject, comp) {
  // For this simplified implementation, we'll use property type as the main feature
  if (subject.propertyType === comp.propertyType) {
    return 1.0;
  } else {
    // Different property types are less similar
    return 0.3;
  }
  
  // In a real implementation, this would compare detailed property features
  // stored in the features JSONB field
}

// Generate adjustment values
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
  
  return adjustments;
}

// Analyze market trends
app.post('/market/analyze', async (req, res) => {
  try {
    const { 
      city, 
      state, 
      zipCode, 
      propertyType, 
      timeframe = 12, // months
      bedrooms,
      bathrooms,
      minYearBuilt,
      maxYearBuilt
    } = req.body;
    
    // Validate required fields
    if (!city || !state) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['city', 'state']
      });
    }
    
    // Build query conditions
    let conditions = [
      eq(properties.city, city),
      eq(properties.state, state)
    ];
    
    if (zipCode) {
      conditions.push(eq(properties.zipCode, zipCode));
    }
    
    if (propertyType) {
      conditions.push(eq(properties.propertyType, propertyType));
    }
    
    if (bedrooms) {
      conditions.push(eq(properties.bedrooms, Number(bedrooms)));
    }
    
    if (bathrooms) {
      conditions.push(eq(properties.bathrooms, Number(bathrooms)));
    }
    
    if (minYearBuilt) {
      conditions.push(gte(properties.yearBuilt, Number(minYearBuilt)));
    }
    
    if (maxYearBuilt) {
      conditions.push(lte(properties.yearBuilt, Number(maxYearBuilt)));
    }
    
    // Get properties in the area
    const areaProperties = await db.select()
      .from(properties)
      .where(and(...conditions));
    
    // For market analysis, we'd normally query sales data
    // For this implementation, we'll generate some synthetic market metrics
    
    // Get historical timeframe - last X months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - timeframe);
    
    // In a real implementation, we would get comparable sales within the timeframe
    // and do actual analysis. For now, we'll generate representative data
    
    // Calculate market metrics
    const marketMetrics = calculateMarketMetrics(areaProperties, startDate, endDate);
    
    // Calculate trends
    const marketTrends = analyzeMarketTrends(marketMetrics, timeframe);
    
    // Get overall market conditions assessment
    const marketConditions = assessMarketConditions(marketMetrics, marketTrends);
    
    // Generate market summary
    const location = zipCode ? `${city}, ${state} ${zipCode}` : `${city}, ${state}`;
    const marketSummary = generateMarketSummary(location, marketMetrics, marketConditions);
    
    res.json({
      location: {
        city,
        state,
        zipCode
      },
      propertyType,
      timeframe,
      metrics: marketMetrics,
      trends: marketTrends,
      conditions: marketConditions,
      summary: marketSummary
    });
  } catch (error) {
    console.error('Error analyzing market:', error);
    res.status(500).json({ error: 'Failed to analyze market trends' });
  }
});

// Calculate market metrics
function calculateMarketMetrics(properties, startDate, endDate) {
  // In a real implementation, this would calculate actual metrics
  // For this simplified version, we'll generate reasonable values
  
  // Calculate average price per property type
  const propertyTypes = {};
  let totalPropertyCount = 0;
  
  properties.forEach(property => {
    totalPropertyCount++;
    
    if (!propertyTypes[property.propertyType]) {
      propertyTypes[property.propertyType] = {
        count: 0,
        totalSize: 0,
        prices: []
      };
    }
    
    propertyTypes[property.propertyType].count++;
    
    if (property.buildingSize) {
      const size = parseFloat(property.buildingSize);
      if (!isNaN(size)) {
        propertyTypes[property.propertyType].totalSize += size;
      }
    }
    
    // For this demo, we'll generate a reasonable price based on property attributes
    const basePrice = {
      'residential': 300000,
      'commercial': 750000,
      'industrial': 1200000,
      'land': 175000,
      'mixed_use': 850000
    }[property.propertyType] || 350000;
    
    // Adjust by size if available
    let priceAdjustment = 1.0;
    if (property.buildingSize) {
      const size = parseFloat(property.buildingSize);
      if (!isNaN(size)) {
        // Adjust based on difference from average size for that type
        const avgSize = {
          'residential': 2000,
          'commercial': 5000,
          'industrial': 15000,
          'land': 10000,
          'mixed_use': 7500
        }[property.propertyType] || 2000;
        
        priceAdjustment = 0.5 + (size / avgSize) * 0.5;
      }
    }
    
    // Adjust by age if available
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      // Newer properties are worth more, with diminishing returns
      priceAdjustment *= Math.max(0.7, 1 - (age * 0.01));
    }
    
    // Add some randomness to simulate market variability
    priceAdjustment *= 0.85 + (Math.random() * 0.3);
    
    const estimatedPrice = Math.round(basePrice * priceAdjustment);
    propertyTypes[property.propertyType].prices.push(estimatedPrice);
  });
  
  // Calculate averages and medians
  const metrics = {
    totalProperties: totalPropertyCount,
    averageDaysOnMarket: Math.round(30 + Math.random() * 60),
    medianDaysOnMarket: Math.round(20 + Math.random() * 50),
    byPropertyType: {}
  };
  
  Object.keys(propertyTypes).forEach(type => {
    const data = propertyTypes[type];
    const prices = data.prices.sort((a, b) => a - b);
    
    const sum = prices.reduce((total, price) => total + price, 0);
    const average = Math.round(sum / prices.length);
    
    const median = prices.length % 2 === 0 
      ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
      : prices[Math.floor(prices.length / 2)];
    
    const avgSize = data.totalSize > 0 ? Math.round(data.totalSize / data.count) : null;
    const pricePerSqFt = avgSize ? Math.round(average / avgSize) : null;
    
    metrics.byPropertyType[type] = {
      count: data.count,
      averagePrice: average,
      medianPrice: median,
      averageSize: avgSize,
      pricePerSqFt,
      inventory: Math.round(data.count * (0.1 + Math.random() * 0.3)), // 10-40% of properties on market
      averageDaysOnMarket: Math.round(metrics.averageDaysOnMarket * (0.8 + Math.random() * 0.4)), // Variation by type
    };
  });
  
  return metrics;
}

// Analyze market trends
function analyzeMarketTrends(metrics, timeframe) {
  // In a real implementation, this would compare current metrics with historical data
  // For this simplified version, we'll generate reasonable trends
  
  const trends = {
    priceChange: {},
    inventoryChange: {},
    daysOnMarketChange: {}
  };
  
  // Generate price trends by property type
  Object.keys(metrics.byPropertyType).forEach(type => {
    // Generate a plausible yearly appreciation rate between 2-8%
    const yearlyAppreciation = 0.02 + (Math.random() * 0.06);
    
    // Calculate proportional appreciation for the specified timeframe
    const timeframeAppreciation = (yearlyAppreciation / 12) * timeframe;
    
    // Add some random variation
    const priceChange = timeframeAppreciation * (0.7 + Math.random() * 0.6);
    
    trends.priceChange[type] = {
      percent: priceChange,
      value: Math.round(metrics.byPropertyType[type].averagePrice * priceChange)
    };
    
    // Inventory trends - can go up or down
    trends.inventoryChange[type] = {
      percent: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.2),
      direction: Math.random() > 0.5 ? 'increase' : 'decrease'
    };
    
    // Days on market trends - can go up or down
    trends.daysOnMarketChange[type] = {
      percent: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.15),
      direction: Math.random() > 0.5 ? 'increase' : 'decrease'
    };
  });
  
  return trends;
}

// Assess market conditions
function assessMarketConditions(metrics, trends) {
  const conditions = {
    byPropertyType: {}
  };
  
  Object.keys(metrics.byPropertyType).forEach(type => {
    // Determine market type based on price and inventory trends
    const priceChange = trends.priceChange[type].percent;
    const inventoryChange = trends.inventoryChange[type].percent;
    const daysOnMarketChange = trends.daysOnMarketChange[type].percent;
    
    let marketType, demand, priceDirection;
    
    // Determine market type
    if (priceChange > 0.04 && inventoryChange < 0 && daysOnMarketChange < 0) {
      marketType = 'Hot Seller\'s Market';
      demand = 'Very Strong';
    } else if (priceChange > 0.02 && (inventoryChange < 0.05 || daysOnMarketChange < 0)) {
      marketType = 'Seller\'s Market';
      demand = 'Strong';
    } else if (priceChange > 0 && priceChange <= 0.02) {
      marketType = 'Balanced Market';
      demand = 'Stable';
    } else if (priceChange <= 0 && priceChange >= -0.02) {
      marketType = 'Slight Buyer\'s Market';
      demand = 'Moderate';
    } else {
      marketType = 'Buyer\'s Market';
      demand = 'Weak';
    }
    
    // Determine price direction
    if (priceChange > 0.03) {
      priceDirection = 'Rising Rapidly';
    } else if (priceChange > 0) {
      priceDirection = 'Rising';
    } else if (priceChange === 0) {
      priceDirection = 'Stable';
    } else if (priceChange > -0.03) {
      priceDirection = 'Declining';
    } else {
      priceDirection = 'Declining Rapidly';
    }
    
    conditions.byPropertyType[type] = {
      marketType,
      demand,
      priceDirection,
      overall: getOverallCondition(marketType, demand, priceDirection)
    };
  });
  
  return conditions;
}

// Get overall market condition
function getOverallCondition(marketType, demand, priceDirection) {
  // Simplified logic to determine overall market condition
  if (marketType.includes('Hot Seller') || demand === 'Very Strong') {
    return 'Excellent';
  } else if (marketType.includes('Seller') || demand === 'Strong') {
    return 'Good';
  } else if (marketType.includes('Balanced') || demand === 'Stable') {
    return 'Fair';
  } else if (marketType.includes('Slight Buyer') || demand === 'Moderate') {
    return 'Moderate';
  } else {
    return 'Challenging';
  }
}

// Generate market summary
function generateMarketSummary(location, metrics, conditions) {
  // Get the most common property type
  let primaryType = '';
  let maxCount = 0;
  
  Object.keys(metrics.byPropertyType).forEach(type => {
    if (metrics.byPropertyType[type].count > maxCount) {
      maxCount = metrics.byPropertyType[type].count;
      primaryType = type;
    }
  });
  
  if (!primaryType) {
    return `The ${location} real estate market has insufficient data for analysis.`;
  }
  
  const typeMetrics = metrics.byPropertyType[primaryType];
  const typeConditions = conditions.byPropertyType[primaryType];
  
  return `The ${location} ${primaryType} real estate market is currently a ${typeConditions.marketType} 
with ${typeConditions.demand.toLowerCase()} buyer demand. Property values are ${typeConditions.priceDirection.toLowerCase()}, 
with an average price of ${formatCurrency(typeMetrics.averagePrice)}${typeMetrics.pricePerSqFt ? ` (${formatCurrency(typeMetrics.pricePerSqFt)}/sqft)` : ''}. 
The average property spends ${typeMetrics.averageDaysOnMarket} days on the market before selling.`;
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Analysis Service Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analysis service running on port ${PORT}`);
});

export default app;