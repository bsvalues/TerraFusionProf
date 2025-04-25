/**
 * TerraFusionPro AI Agents
 * 
 * This package contains AI agent implementations for data validation,
 * analysis, and quality control within the TerraFusionPro platform.
 */

// Agent types
const AGENT_TYPES = {
  DATA_VALIDATOR: 'data-validator',
  COMP_SELECTOR: 'comparable-selector',
  QC_REVIEWER: 'quality-control',
  MARKET_ANALYZER: 'market-analyzer'
};

// Agent configuration
const DEFAULT_CONFIG = {
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  logging: true
};

/**
 * Initialize the agent system with configuration
 * @param {Object} config - Configuration options for the agent system
 * @returns {Object} - The initialized agent system
 */
function initializeAgents(config = {}) {
  // Merge default config with provided config
  const agentConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  
  console.log('Initializing TerraFusionPro AI Agents with config:', agentConfig);
  
  return {
    config: agentConfig,
    
    /**
     * Run a specific agent with provided data
     * @param {string} agentType - Type of agent to run
     * @param {Object} data - Data for the agent to process
     * @param {Object} options - Additional options for the agent
     * @returns {Promise<Object>} - Results from the agent
     */
    async runAgent(agentType, data, options = {}) {
      return runAgent(agentType, data, { ...agentConfig, ...options });
    }
  };
}

/**
 * Run a specific agent with provided data
 * @param {string} agentType - Type of agent to run
 * @param {Object} data - Data for the agent to process
 * @param {Object} options - Additional options for the agent
 * @returns {Promise<Object>} - Results from the agent
 */
async function runAgent(agentType, data, options = {}) {
  if (!Object.values(AGENT_TYPES).includes(agentType)) {
    throw new Error(`Invalid agent type: ${agentType}`);
  }
  
  if (options.logging) {
    console.log(`Running agent ${agentType} with data:`, 
      options.verboseLogging ? data : `${Object.keys(data).length} keys`);
  }
  
  // Implement agent-specific logic
  let result;
  
  try {
    switch (agentType) {
      case AGENT_TYPES.DATA_VALIDATOR:
        result = await runDataValidator(data, options);
        break;
      case AGENT_TYPES.COMP_SELECTOR:
        result = await runCompSelector(data, options);
        break;
      case AGENT_TYPES.QC_REVIEWER:
        result = await runQCReviewer(data, options);
        break;
      case AGENT_TYPES.MARKET_ANALYZER:
        result = await runMarketAnalyzer(data, options);
        break;
      default:
        throw new Error(`Agent implementation not found for type: ${agentType}`);
    }
    
    if (options.logging) {
      console.log(`Agent ${agentType} completed successfully`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error running agent ${agentType}:`, error);
    
    // Retry logic
    if (options.currentRetry < options.maxRetries) {
      const nextRetry = (options.currentRetry || 0) + 1;
      console.log(`Retrying agent ${agentType} (${nextRetry}/${options.maxRetries})...`);
      
      return runAgent(agentType, data, {
        ...options,
        currentRetry: nextRetry
      });
    }
    
    throw error;
  }
}

/**
 * Run the data validator agent to check data quality and consistency
 * @param {Object} data - Property data to validate
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Validation results
 */
async function runDataValidator(data, options) {
  // In a real implementation, this would use AI/ML to validate the data
  // For now, we'll implement some basic rule-based validation
  
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  // Example validation rules
  // Required fields
  const requiredFields = ['address', 'city', 'state', 'zipCode', 'propertyType'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      validationResults.isValid = false;
      validationResults.errors.push({
        field,
        message: `Missing required field: ${field}`,
        severity: 'error'
      });
    }
  }
  
  // Validate zip code format
  if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
    validationResults.isValid = false;
    validationResults.errors.push({
      field: 'zipCode',
      message: 'Invalid zip code format',
      severity: 'error'
    });
  }
  
  // Validate property type
  const validPropertyTypes = ['residential', 'commercial', 'industrial', 'land', 'mixed_use'];
  if (data.propertyType && !validPropertyTypes.includes(data.propertyType)) {
    validationResults.isValid = false;
    validationResults.errors.push({
      field: 'propertyType',
      message: `Invalid property type: ${data.propertyType}. Must be one of: ${validPropertyTypes.join(', ')}`,
      severity: 'error'
    });
  }
  
  // Validate year built
  if (data.yearBuilt) {
    const year = parseInt(data.yearBuilt, 10);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(year)) {
      validationResults.isValid = false;
      validationResults.errors.push({
        field: 'yearBuilt',
        message: 'Year built must be a number',
        severity: 'error'
      });
    } else if (year < 1800 || year > currentYear) {
      validationResults.warnings.push({
        field: 'yearBuilt',
        message: `Year built (${year}) seems unusual. Please verify.`,
        severity: 'warning'
      });
    }
  }
  
  // Validate square footage
  if (data.squareFeet) {
    const sqft = parseInt(data.squareFeet, 10);
    
    if (isNaN(sqft)) {
      validationResults.isValid = false;
      validationResults.errors.push({
        field: 'squareFeet',
        message: 'Square feet must be a number',
        severity: 'error'
      });
    } else if (sqft < 100 || sqft > 20000) {
      validationResults.warnings.push({
        field: 'squareFeet',
        message: `Square footage (${sqft}) seems unusual. Please verify.`,
        severity: 'warning'
      });
    }
  }
  
  // Add suggestions for improving data quality
  if (!data.description) {
    validationResults.suggestions.push({
      field: 'description',
      message: 'Adding a property description would improve data quality',
      severity: 'suggestion'
    });
  }
  
  if (!data.lotSize && ['residential', 'land'].includes(data.propertyType)) {
    validationResults.suggestions.push({
      field: 'lotSize',
      message: 'Adding lot size information would improve data quality',
      severity: 'suggestion'
    });
  }
  
  return validationResults;
}

/**
 * Run the comparable selector agent to find and rank comparable properties
 * @param {Object} data - Property and market data for comp selection
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Selected comparables with rankings
 */
async function runCompSelector(data, options) {
  // In a real implementation, this would use AI/ML to select comps
  // For now, we'll implement a basic algorithm
  
  const { subject, candidates } = data;
  
  if (!subject || !candidates || !Array.isArray(candidates)) {
    throw new Error('Invalid data format for comparable selection');
  }
  
  // Calculate similarity scores for each candidate
  const rankedComps = candidates.map(comp => {
    // Basic similarity metrics
    const metrics = {
      locationScore: calculateLocationScore(subject, comp),
      sizeScore: calculateSizeScore(subject, comp),
      ageScore: calculateAgeScore(subject, comp),
      featureScore: calculateFeatureScore(subject, comp),
      qualityScore: Math.random() * 5 // In a real implementation, this would be model-based
    };
    
    // Calculate overall score
    const overallScore = (
      metrics.locationScore * 0.4 +
      metrics.sizeScore * 0.25 +
      metrics.ageScore * 0.15 +
      metrics.featureScore * 0.1 +
      metrics.qualityScore * 0.1
    );
    
    return {
      ...comp,
      similarity: {
        overallScore,
        metrics
      }
    };
  });
  
  // Sort by overall score
  rankedComps.sort((a, b) => b.similarity.overallScore - a.similarity.overallScore);
  
  // Generate adjustments for top comps
  const selectedComps = rankedComps.slice(0, options.maxComps || 5).map(comp => {
    const adjustments = generateAdjustments(subject, comp);
    const totalAdjustment = Object.values(adjustments).reduce((sum, adj) => sum + adj.value, 0);
    
    return {
      ...comp,
      adjustments,
      totalAdjustment,
      adjustedValue: comp.salePrice + totalAdjustment
    };
  });
  
  return {
    subject,
    comparables: selectedComps,
    adjustmentExplanation: 'Adjustments are calculated based on differences in property characteristics.'
  };
}

// Helper functions for comp selection
function calculateLocationScore(subject, comp) {
  // In a real implementation, this would use geolocation and neighborhood data
  if (subject.zipCode === comp.zipCode) return 5;
  if (subject.city === comp.city) return 4;
  if (subject.state === comp.state) return 2;
  return 1;
}

function calculateSizeScore(subject, comp) {
  if (!subject.squareFeet || !comp.squareFeet) return 3;
  
  const ratio = comp.squareFeet / subject.squareFeet;
  if (ratio > 0.9 && ratio < 1.1) return 5;
  if (ratio > 0.8 && ratio < 1.2) return 4;
  if (ratio > 0.7 && ratio < 1.3) return 3;
  if (ratio > 0.6 && ratio < 1.5) return 2;
  return 1;
}

function calculateAgeScore(subject, comp) {
  if (!subject.yearBuilt || !comp.yearBuilt) return 3;
  
  const ageDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
  if (ageDiff < 3) return 5;
  if (ageDiff < 5) return 4;
  if (ageDiff < 10) return 3;
  if (ageDiff < 20) return 2;
  return 1;
}

function calculateFeatureScore(subject, comp) {
  let score = 3;
  
  // Bedrooms
  if (subject.bedrooms === comp.bedrooms) {
    score += 1;
  } else if (Math.abs(subject.bedrooms - comp.bedrooms) === 1) {
    score += 0.5;
  }
  
  // Bathrooms
  if (subject.bathrooms === comp.bathrooms) {
    score += 1;
  } else if (Math.abs(subject.bathrooms - comp.bathrooms) === 0.5) {
    score += 0.5;
  }
  
  return Math.min(score, 5);
}

function generateAdjustments(subject, comp) {
  const adjustments = {};
  
  // Size adjustment
  if (subject.squareFeet && comp.squareFeet) {
    const sizeDiff = subject.squareFeet - comp.squareFeet;
    adjustments.size = {
      description: `Size Adjustment (${sizeDiff > 0 ? '+' : ''}${sizeDiff} sq ft)`,
      value: sizeDiff * 100 // $100 per sq ft
    };
  }
  
  // Age adjustment
  if (subject.yearBuilt && comp.yearBuilt) {
    const ageDiff = subject.yearBuilt - comp.yearBuilt;
    adjustments.age = {
      description: `Age Adjustment (${ageDiff > 0 ? 'newer' : 'older'} by ${Math.abs(ageDiff)} years)`,
      value: ageDiff * 500 // $500 per year
    };
  }
  
  // Bedroom adjustment
  if (subject.bedrooms && comp.bedrooms) {
    const bedroomDiff = subject.bedrooms - comp.bedrooms;
    if (bedroomDiff !== 0) {
      adjustments.bedrooms = {
        description: `Bedroom Adjustment (${bedroomDiff > 0 ? '+' : ''}${bedroomDiff})`,
        value: bedroomDiff * 10000 // $10k per bedroom
      };
    }
  }
  
  // Bathroom adjustment
  if (subject.bathrooms && comp.bathrooms) {
    const bathroomDiff = subject.bathrooms - comp.bathrooms;
    if (bathroomDiff !== 0) {
      adjustments.bathrooms = {
        description: `Bathroom Adjustment (${bathroomDiff > 0 ? '+' : ''}${bathroomDiff})`,
        value: bathroomDiff * 7500 // $7.5k per bathroom
      };
    }
  }
  
  return adjustments;
}

/**
 * Run the quality control reviewer agent to check report accuracy
 * @param {Object} data - Report data to review
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - QC review results
 */
async function runQCReviewer(data, options) {
  // In a real implementation, this would use AI/ML to review the report
  
  const { report, property, comparables } = data;
  
  if (!report || !property) {
    throw new Error('Invalid data format for QC review');
  }
  
  const reviewResults = {
    passedQc: true,
    score: 0,
    issues: [],
    recommendations: []
  };
  
  // Check for common issues
  
  // 1. Value reasonableness
  if (report.value) {
    const pricePerSqFt = property.squareFeet ? report.value / property.squareFeet : null;
    
    if (pricePerSqFt && (pricePerSqFt < 50 || pricePerSqFt > 1000)) {
      reviewResults.passedQc = false;
      reviewResults.issues.push({
        type: 'valueUnreasonable',
        message: `Price per square foot (${pricePerSqFt.toFixed(2)}) is outside typical range`,
        severity: 'high'
      });
    }
  }
  
  // 2. Comp selection quality
  if (comparables && comparables.length > 0) {
    // Check if any comp is too far from the subject property
    const distantComps = comparables.filter(comp => 
      comp.similarity && comp.similarity.metrics.locationScore < 3);
    
    if (distantComps.length > 0) {
      reviewResults.issues.push({
        type: 'distantComparables',
        message: `${distantComps.length} comparables are distant from the subject property`,
        severity: 'medium',
        comps: distantComps.map(c => c.address || c.id)
      });
    }
    
    // Check for excessive adjustments
    const highAdjustmentComps = comparables.filter(comp => 
      comp.totalAdjustment && Math.abs(comp.totalAdjustment) > comp.salePrice * 0.15);
    
    if (highAdjustmentComps.length > 0) {
      reviewResults.issues.push({
        type: 'excessiveAdjustments',
        message: `${highAdjustmentComps.length} comparables have adjustments exceeding 15% of sale price`,
        severity: 'medium',
        comps: highAdjustmentComps.map(c => c.address || c.id)
      });
    }
  } else if (report.value) {
    reviewResults.passedQc = false;
    reviewResults.issues.push({
      type: 'missingComparables',
      message: 'No comparables found in the report',
      severity: 'high'
    });
  }
  
  // 3. Data completion
  const requiredFields = [
    'purpose', 'effectiveDate', 'methodology'
  ];
  
  const missingFields = requiredFields.filter(field => !report[field]);
  
  if (missingFields.length > 0) {
    reviewResults.issues.push({
      type: 'incompleteReport',
      message: `Report is missing required fields: ${missingFields.join(', ')}`,
      severity: 'medium',
      fields: missingFields
    });
  }
  
  // Make recommendations
  if (reportHasMinimalDescription(report)) {
    reviewResults.recommendations.push({
      type: 'enhanceDescription',
      message: 'Consider adding more detail to the property description',
      severity: 'low'
    });
  }
  
  if (!report.methodology || report.methodology.length < 100) {
    reviewResults.recommendations.push({
      type: 'clarifyMethodology',
      message: 'Enhance the valuation methodology explanation',
      severity: 'medium'
    });
  }
  
  // Calculate overall QC score (0-100)
  reviewResults.score = calculateQcScore(reviewResults);
  
  // Overall pass/fail
  reviewResults.passedQc = reviewResults.score >= 80 && 
    !reviewResults.issues.some(issue => issue.severity === 'high');
  
  return reviewResults;
}

// Helper functions for QC review
function reportHasMinimalDescription(report) {
  if (!report.notes) return true;
  return report.notes.length < 100;
}

function calculateQcScore(reviewResults) {
  // Start with perfect score
  let score = 100;
  
  // Deduct for issues based on severity
  for (const issue of reviewResults.issues) {
    if (issue.severity === 'high') {
      score -= 20;
    } else if (issue.severity === 'medium') {
      score -= 10;
    } else {
      score -= 5;
    }
  }
  
  // Minor deductions for recommendations
  score -= reviewResults.recommendations.length * 2;
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Run the market analyzer agent to assess market conditions
 * @param {Object} data - Market data to analyze
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Market analysis results
 */
async function runMarketAnalyzer(data, options) {
  // In a real implementation, this would use AI/ML for market analysis
  
  const { location, salesData, timeFrame = '12months' } = data;
  
  if (!location || !salesData || !Array.isArray(salesData)) {
    throw new Error('Invalid data format for market analysis');
  }
  
  // Basic market metrics
  const metrics = calculateMarketMetrics(salesData);
  
  // Market trend analysis
  const trends = analyzeMarketTrends(salesData, timeFrame);
  
  // Market conditions assessment
  const conditions = assessMarketConditions(metrics, trends);
  
  return {
    location,
    timeFrame,
    timestamp: new Date().toISOString(),
    metrics,
    trends,
    conditions,
    summary: generateMarketSummary(location, metrics, conditions)
  };
}

// Helper functions for market analysis
function calculateMarketMetrics(salesData) {
  // Sort sales by date
  const sortedSales = [...salesData].sort((a, b) => 
    new Date(a.saleDate) - new Date(b.saleDate));
  
  // Calculate median price
  const prices = sortedSales.map(sale => sale.salePrice);
  prices.sort((a, b) => a - b);
  const medianPrice = prices.length % 2 === 0
    ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
    : prices[Math.floor(prices.length / 2)];
  
  // Calculate average days on market
  const totalDom = sortedSales.reduce((sum, sale) => sum + (sale.daysOnMarket || 0), 0);
  const avgDom = sortedSales.length > 0 ? totalDom / sortedSales.length : 0;
  
  // Calculate median price per square foot
  const pricesPerSqFt = sortedSales
    .filter(sale => sale.salePrice && sale.squareFeet)
    .map(sale => sale.salePrice / sale.squareFeet);
  pricesPerSqFt.sort((a, b) => a - b);
  const medianPricePerSqFt = pricesPerSqFt.length % 2 === 0
    ? (pricesPerSqFt[pricesPerSqFt.length / 2 - 1] + pricesPerSqFt[pricesPerSqFt.length / 2]) / 2
    : pricesPerSqFt[Math.floor(pricesPerSqFt.length / 2)];
  
  // Inventory metrics
  const currentInventory = sortedSales.filter(sale => sale.status === 'active').length;
  const monthlySales = sortedSales.length / 12; // Assuming data is for 12 months
  const monthsOfInventory = monthlySales > 0 ? currentInventory / monthlySales : 0;
  
  return {
    medianPrice,
    averageDaysOnMarket: avgDom,
    medianPricePerSqFt,
    totalSales: sortedSales.length,
    currentInventory,
    monthsOfInventory
  };
}

function analyzeMarketTrends(salesData, timeFrame) {
  // Sort sales by date
  const sortedSales = [...salesData].sort((a, b) => 
    new Date(a.saleDate) - new Date(b.saleDate));
  
  const months = timeFrame === '12months' ? 12 : timeFrame === '6months' ? 6 : 24;
  const now = new Date();
  
  // Group sales by month
  const salesByMonth = {};
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now);
    monthDate.setMonth(now.getMonth() - months + i);
    const monthKey = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    salesByMonth[monthKey] = [];
  }
  
  // Populate sales by month
  for (const sale of sortedSales) {
    const saleDate = new Date(sale.saleDate);
    const monthKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (salesByMonth[monthKey]) {
      salesByMonth[monthKey].push(sale);
    }
  }
  
  // Calculate median price and DOM by month
  const priceByMonth = {};
  const domByMonth = {};
  
  for (const [month, sales] of Object.entries(salesByMonth)) {
    if (sales.length === 0) {
      priceByMonth[month] = null;
      domByMonth[month] = null;
      continue;
    }
    
    // Median price
    const prices = sales.map(s => s.salePrice).sort((a, b) => a - b);
    priceByMonth[month] = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];
    
    // Average DOM
    const totalDom = sales.reduce((sum, s) => sum + (s.daysOnMarket || 0), 0);
    domByMonth[month] = totalDom / sales.length;
  }
  
  // Calculate price trend
  const priceValues = Object.values(priceByMonth).filter(p => p !== null);
  const firstPrice = priceValues[0] || 0;
  const lastPrice = priceValues[priceValues.length - 1] || 0;
  const priceChange = firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  
  // Calculate DOM trend
  const domValues = Object.values(domByMonth).filter(d => d !== null);
  const firstDom = domValues[0] || 0;
  const lastDom = domValues[domValues.length - 1] || 0;
  const domChange = firstDom ? ((lastDom - firstDom) / firstDom) * 100 : 0;
  
  return {
    priceByMonth,
    priceChange,
    priceTrend: priceChange > 3 ? 'increasing' : priceChange < -3 ? 'decreasing' : 'stable',
    domByMonth,
    domChange,
    domTrend: domChange > 10 ? 'increasing' : domChange < -10 ? 'decreasing' : 'stable'
  };
}

function assessMarketConditions(metrics, trends) {
  let marketType = 'balanced';
  let demand = 'moderate';
  let supplyLevel = 'balanced';
  
  // Determine market type based on months of inventory
  if (metrics.monthsOfInventory < 3) {
    marketType = 'seller';
  } else if (metrics.monthsOfInventory > 6) {
    marketType = 'buyer';
  }
  
  // Determine demand based on days on market and price trends
  if (metrics.averageDaysOnMarket < 30 && trends.priceChange > 5) {
    demand = 'strong';
  } else if (metrics.averageDaysOnMarket > 60 && trends.priceChange < 0) {
    demand = 'weak';
  }
  
  // Determine supply level based on inventory
  if (metrics.monthsOfInventory < 2) {
    supplyLevel = 'low';
  } else if (metrics.monthsOfInventory > 8) {
    supplyLevel = 'high';
  }
  
  return {
    marketType,
    demand,
    supplyLevel,
    competitiveness: marketType === 'seller' ? 'high' : marketType === 'buyer' ? 'low' : 'moderate',
    overallCondition: getOverallCondition(marketType, demand, trends.priceChange)
  };
}

function getOverallCondition(marketType, demand, priceChange) {
  if (marketType === 'seller' && demand === 'strong' && priceChange > 8) {
    return 'hot';
  } else if (marketType === 'buyer' && demand === 'weak' && priceChange < -5) {
    return 'cold';
  } else if (marketType === 'balanced' && demand === 'moderate') {
    return 'stable';
  } else if (marketType === 'seller' || priceChange > 3) {
    return 'warming';
  } else if (marketType === 'buyer' || priceChange < -3) {
    return 'cooling';
  } else {
    return 'stable';
  }
}

function generateMarketSummary(location, metrics, conditions) {
  const locationName = location.city || location.zipCode || location.state || 'this area';
  const marketType = conditions.marketType === 'seller' ? 'seller\'s' : conditions.marketType === 'buyer' ? 'buyer\'s' : 'balanced';
  const priceTrend = metrics.medianPrice > 0 ? 'increasing' : 'decreasing';
  
  return `The real estate market in ${locationName} is currently a ${marketType} market with ${conditions.demand} demand and ${conditions.supplyLevel} inventory levels. Properties are selling in an average of ${Math.round(metrics.averageDaysOnMarket)} days with median prices ${priceTrend} to ${formatCurrency(metrics.medianPrice)}. Overall market conditions are ${conditions.overallCondition}.`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0 
  }).format(value);
}

// Export functions and constants
export {
  initializeAgents,
  runAgent,
  AGENT_TYPES
};

export default {
  initializeAgents,
  runAgent,
  AGENT_TYPES
};