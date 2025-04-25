/**
 * TerraFusionPro AI Agents
 * 
 * This module provides AI-powered agents for data validation, comparable property selection,
 * quality control reviews, and market analysis to enhance appraisal accuracy and efficiency.
 */

import Ajv from 'ajv';

/**
 * Initialize the agent system with configuration
 * @param {Object} config - Configuration options for the agent system
 * @returns {Object} - The initialized agent system
 */
function initializeAgents(config = {}) {
  // Default configuration
  const defaultConfig = {
    enableLogging: true,
    featureFlags: {
      dataValidation: true,
      comparableSelection: true,
      qcReview: true,
      marketAnalysis: true
    },
    thresholds: {
      similarityThreshold: 0.85,      // Minimum similarity score for comps
      qcScoreThreshold: 0.75,         // Minimum QC score to pass review
      adjustmentThreshold: 0.25,      // Maximum total adjustment percentage
      confidenceThreshold: 0.7        // Minimum confidence score for predictions
    }
  };
  
  // Merge provided config with defaults
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Initialize validator
  const ajv = new Ajv({ allErrors: true });
  
  // Log initialization if enabled
  if (mergedConfig.enableLogging) {
    console.log('Initializing TerraFusionPro AI Agents with config:', JSON.stringify(mergedConfig));
  }
  
  return {
    // Run a specific agent
    async runAgent(agentType, data, options = {}) {
      if (mergedConfig.enableLogging) {
        console.log(`Running ${agentType} agent with options:`, JSON.stringify(options));
      }
      
      switch (agentType) {
        case 'dataValidator':
          return runDataValidator(data, { ...mergedConfig, ...options });
          
        case 'compSelector':
          return runCompSelector(data, { ...mergedConfig, ...options });
          
        case 'qcReviewer':
          return runQCReviewer(data, { ...mergedConfig, ...options });
          
        case 'marketAnalyzer':
          return runMarketAnalyzer(data, { ...mergedConfig, ...options });
          
        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }
    },
    
    // Get current agent configuration
    getConfig() {
      return { ...mergedConfig };
    },
    
    // Update agent configuration
    updateConfig(newConfig) {
      Object.assign(mergedConfig, newConfig);
      return { ...mergedConfig };
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
  const agents = initializeAgents(options);
  return agents.runAgent(agentType, data, options);
}

/**
 * Run the data validator agent to check data quality and consistency
 * @param {Object} data - Property data to validate
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Validation results
 */
async function runDataValidator(data, options) {
  const ajv = new Ajv({ allErrors: true });
  
  // Define validation schema based on property type
  let schema;
  if (data.propertyType === 'residential') {
    schema = {
      type: 'object',
      required: ['address', 'city', 'state', 'zipCode', 'propertyType', 'bedrooms', 'bathrooms'],
      properties: {
        address: { type: 'string', minLength: 5 },
        city: { type: 'string', minLength: 2 },
        state: { type: 'string', minLength: 2 },
        zipCode: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' },
        propertyType: { type: 'string', enum: ['residential'] },
        yearBuilt: { type: 'integer', minimum: 1800, maximum: new Date().getFullYear() },
        bedrooms: { type: 'integer', minimum: 0 },
        bathrooms: { type: 'integer', minimum: 0 },
        buildingSize: { type: 'string' },
        lotSize: { type: 'string' }
      }
    };
  } else if (data.propertyType === 'commercial') {
    schema = {
      type: 'object',
      required: ['address', 'city', 'state', 'zipCode', 'propertyType', 'buildingSize', 'lotSize'],
      properties: {
        address: { type: 'string', minLength: 5 },
        city: { type: 'string', minLength: 2 },
        state: { type: 'string', minLength: 2 },
        zipCode: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' },
        propertyType: { type: 'string', enum: ['commercial'] },
        yearBuilt: { type: 'integer', minimum: 1800, maximum: new Date().getFullYear() },
        buildingSize: { type: 'string' },
        lotSize: { type: 'string' }
      }
    };
  } else {
    // Default schema for other property types
    schema = {
      type: 'object',
      required: ['address', 'city', 'state', 'zipCode', 'propertyType'],
      properties: {
        address: { type: 'string', minLength: 5 },
        city: { type: 'string', minLength: 2 },
        state: { type: 'string', minLength: 2 },
        zipCode: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' },
        propertyType: { type: 'string' }
      }
    };
  }
  
  // Compile schema
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  // Identify outliers in numerical values
  const outliers = [];
  if (data.propertyType === 'residential') {
    // Check for potentially problematic values
    if (data.bedrooms > 10) {
      outliers.push({ field: 'bedrooms', value: data.bedrooms, message: 'Unusually high number of bedrooms' });
    }
    if (data.bathrooms > 10) {
      outliers.push({ field: 'bathrooms', value: data.bathrooms, message: 'Unusually high number of bathrooms' });
    }
    if (data.yearBuilt && data.yearBuilt < 1900 && data.yearBuilt > 1800) {
      outliers.push({ field: 'yearBuilt', value: data.yearBuilt, message: 'Property is very old, verify year built' });
    }
  }
  
  // Compute confidence score
  let confidenceScore = 1.0;
  if (!valid) {
    // Reduce confidence based on number of validation errors
    confidenceScore -= validate.errors.length * 0.1;
  }
  
  confidenceScore -= outliers.length * 0.05;
  
  // Ensure score is between 0 and 1
  confidenceScore = Math.max(0, Math.min(1, confidenceScore));
  
  return {
    valid,
    errors: valid ? [] : validate.errors,
    outliers,
    confidenceScore,
    timestamp: new Date().toISOString()
  };
}

/**
 * Run the comparable selector agent to find and rank comparable properties
 * @param {Object} data - Property and market data for comp selection
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Selected comparables with rankings
 */
async function runCompSelector(data, options) {
  const { subject, comparables } = data;
  const { similarityThreshold } = options.thresholds;
  
  // Validate inputs
  if (!subject || !comparables || !Array.isArray(comparables)) {
    throw new Error('Invalid input for comparable selection');
  }
  
  // Score and rank each comparable
  const scoredComps = comparables.map(comp => {
    // Calculate similarity scores for different factors
    const locationScore = calculateLocationScore(subject, comp);
    const sizeScore = calculateSizeScore(subject, comp);
    const ageScore = calculateAgeScore(subject, comp);
    const featureScore = calculateFeatureScore(subject, comp);
    
    // Weighted overall similarity score
    const totalScore = (
      locationScore * 0.4 +  // Location is most important
      sizeScore * 0.3 +      // Size is next most important
      ageScore * 0.2 +       // Age is somewhat important
      featureScore * 0.1     // Features are least important
    );
    
    // Calculate adjustments
    const adjustments = generateAdjustments(subject, comp);
    
    return {
      ...comp,
      similarityScore: totalScore.toFixed(2),
      locationScore: locationScore.toFixed(2),
      sizeScore: sizeScore.toFixed(2),
      ageScore: ageScore.toFixed(2),
      featureScore: featureScore.toFixed(2),
      adjustments
    };
  });
  
  // Filter by minimum similarity threshold and sort by score
  const selectedComps = scoredComps
    .filter(comp => comp.similarityScore >= similarityThreshold)
    .sort((a, b) => b.similarityScore - a.similarityScore);
  
  return {
    subject,
    comparables: selectedComps,
    count: selectedComps.length,
    timestamp: new Date().toISOString()
  };
}

function calculateLocationScore(subject, comp) {
  // Simple check if properties are in same zip code
  if (subject.zipCode === comp.zipCode) {
    return 1.0;
  }
  
  // Check if in same city
  if (subject.city === comp.city && subject.state === comp.state) {
    return 0.8;
  }
  
  // Different city but same state
  if (subject.state === comp.state) {
    return 0.4;
  }
  
  // Different state
  return 0.0;
}

function calculateSizeScore(subject, comp) {
  // Compare building size
  let buildingSizeDiff = 0;
  if (subject.buildingSize && comp.buildingSize) {
    // Extract numerical values (assume format like "2,000 sq ft")
    const subjectSize = parseInt(subject.buildingSize.replace(/[^0-9]/g, ''));
    const compSize = parseInt(comp.buildingSize.replace(/[^0-9]/g, ''));
    
    if (!isNaN(subjectSize) && !isNaN(compSize) && subjectSize > 0) {
      buildingSizeDiff = Math.abs(subjectSize - compSize) / subjectSize;
    }
  }
  
  // Compare bedrooms/bathrooms for residential
  let roomCountDiff = 0;
  if (subject.propertyType === 'residential' && comp.propertyType === 'residential') {
    if (subject.bedrooms && comp.bedrooms) {
      const bedroomDiff = Math.abs(subject.bedrooms - comp.bedrooms);
      roomCountDiff += bedroomDiff * 0.15; // 15% penalty per bedroom difference
    }
    
    if (subject.bathrooms && comp.bathrooms) {
      const bathroomDiff = Math.abs(subject.bathrooms - comp.bathrooms);
      roomCountDiff += bathroomDiff * 0.1; // 10% penalty per bathroom difference
    }
  }
  
  // Calculate combined size score
  let sizeScore = 1.0;
  
  // Deduct for building size difference (up to 50%)
  sizeScore -= Math.min(0.5, buildingSizeDiff);
  
  // Deduct for room count differences (up to 50%)
  sizeScore -= Math.min(0.5, roomCountDiff);
  
  return Math.max(0, sizeScore);
}

function calculateAgeScore(subject, comp) {
  if (!subject.yearBuilt || !comp.yearBuilt) {
    return 0.5; // Neutral score if data is missing
  }
  
  const ageDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
  
  // Age differences of 5 years or less are very good
  if (ageDiff <= 5) {
    return 1.0;
  }
  
  // Age differences of 5-10 years are good
  if (ageDiff <= 10) {
    return 0.8;
  }
  
  // Age differences of 10-20 years are acceptable
  if (ageDiff <= 20) {
    return 0.6;
  }
  
  // Age differences of 20-30 years are marginal
  if (ageDiff <= 30) {
    return 0.4;
  }
  
  // Age differences over 30 years are poor comparables
  return 0.2;
}

function calculateFeatureScore(subject, comp) {
  // Default score starts at 1.0
  let score = 1.0;
  
  // Check if property types match
  if (subject.propertyType !== comp.propertyType) {
    score -= 0.5; // Major penalty for different property types
  }
  
  // Compare features if available
  if (subject.features && comp.features) {
    const subjectFeatures = Array.isArray(subject.features) 
      ? subject.features 
      : Object.keys(subject.features);
      
    const compFeatures = Array.isArray(comp.features)
      ? comp.features
      : Object.keys(comp.features);
    
    // Count matching features
    const matchingFeatures = subjectFeatures.filter(f => compFeatures.includes(f));
    
    // Calculate feature match ratio
    const featureMatchRatio = matchingFeatures.length / subjectFeatures.length;
    
    // Adjust score based on feature matches (max adjustment: 0.4)
    score -= 0.4 * (1 - featureMatchRatio);
  }
  
  return Math.max(0, score);
}

function generateAdjustments(subject, comp) {
  const adjustments = [];
  
  // Location adjustment
  if (subject.zipCode !== comp.zipCode) {
    adjustments.push({
      factor: 'location',
      description: 'Different location/zip code',
      adjustment: 0.05 // 5% adjustment for different location
    });
  }
  
  // Size adjustment
  if (subject.buildingSize && comp.buildingSize) {
    // Extract numerical values (assume format like "2,000 sq ft")
    const subjectSize = parseInt(subject.buildingSize.replace(/[^0-9]/g, ''));
    const compSize = parseInt(comp.buildingSize.replace(/[^0-9]/g, ''));
    
    if (!isNaN(subjectSize) && !isNaN(compSize) && subjectSize > 0 && compSize > 0) {
      const sizeDiffPercent = (subjectSize - compSize) / compSize;
      
      if (Math.abs(sizeDiffPercent) > 0.1) { // Only adjust if difference is >10%
        adjustments.push({
          factor: 'size',
          description: subjectSize > compSize ? 'Subject is larger' : 'Subject is smaller',
          adjustment: Math.min(0.15, Math.abs(sizeDiffPercent * 0.5)) // Max 15% adjustment
        });
      }
    }
  }
  
  // Age adjustment
  if (subject.yearBuilt && comp.yearBuilt) {
    const ageDiff = subject.yearBuilt - comp.yearBuilt;
    
    if (Math.abs(ageDiff) > 5) { // Only adjust if difference is >5 years
      adjustments.push({
        factor: 'age',
        description: ageDiff > 0 ? 'Subject is newer' : 'Subject is older',
        adjustment: Math.min(0.1, Math.abs(ageDiff) * 0.005) // 0.5% per year, max 10%
      });
    }
  }
  
  // Feature adjustments for residential properties
  if (subject.propertyType === 'residential' && comp.propertyType === 'residential') {
    // Bedroom count adjustment
    if (subject.bedrooms && comp.bedrooms && subject.bedrooms !== comp.bedrooms) {
      adjustments.push({
        factor: 'bedrooms',
        description: `Subject has ${subject.bedrooms > comp.bedrooms ? 'more' : 'fewer'} bedrooms`,
        adjustment: Math.abs(subject.bedrooms - comp.bedrooms) * 0.025 // 2.5% per bedroom
      });
    }
    
    // Bathroom count adjustment
    if (subject.bathrooms && comp.bathrooms && subject.bathrooms !== comp.bathrooms) {
      adjustments.push({
        factor: 'bathrooms',
        description: `Subject has ${subject.bathrooms > comp.bathrooms ? 'more' : 'fewer'} bathrooms`,
        adjustment: Math.abs(subject.bathrooms - comp.bathrooms) * 0.02 // 2% per bathroom
      });
    }
  }
  
  // Calculate total adjustment
  const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
  
  return {
    factors: adjustments,
    totalAdjustment: totalAdjustment.toFixed(2)
  };
}

/**
 * Run the quality control reviewer agent to check report accuracy
 * @param {Object} data - Report data to review
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - QC review results
 */
async function runQCReviewer(data, options) {
  const { report, comparables } = data;
  const { qcScoreThreshold } = options.thresholds;
  
  // Validate inputs
  if (!report) {
    throw new Error('Invalid input for QC review');
  }
  
  // Initialize review results
  const reviewResults = {
    reportId: report.id || 'unknown',
    findings: [],
    suggestions: [],
    score: 1.0, // Start with perfect score and deduct for issues
    timestamp: new Date().toISOString()
  };
  
  // Check for missing or incomplete data
  if (!report.conclusions || !reportHasMinimalDescription(report)) {
    reviewResults.findings.push({
      severity: 'critical',
      section: 'conclusions',
      message: 'Report lacks substantive conclusions or analysis'
    });
    reviewResults.score -= 0.3; // Major deduction
  }
  
  // Check comparable selection if available
  if (comparables && Array.isArray(comparables)) {
    // Check number of comparables
    if (comparables.length < 3) {
      reviewResults.findings.push({
        severity: 'high',
        section: 'comparables',
        message: 'Insufficient number of comparables (minimum 3 recommended)'
      });
      reviewResults.score -= 0.2;
    }
    
    // Check comparable similarity scores
    const lowSimilarityComps = comparables.filter(comp => comp.similarityScore < 0.7);
    if (lowSimilarityComps.length > 0) {
      reviewResults.findings.push({
        severity: 'medium',
        section: 'comparables',
        message: `${lowSimilarityComps.length} comparable(s) with low similarity scores`
      });
      reviewResults.score -= 0.1;
    }
    
    // Check for excessive adjustments
    const highAdjustmentComps = comparables.filter(comp => 
      comp.adjustments && parseFloat(comp.adjustments.totalAdjustment) > 0.25);
    
    if (highAdjustmentComps.length > 0) {
      reviewResults.findings.push({
        severity: 'medium',
        section: 'comparables',
        message: `${highAdjustmentComps.length} comparable(s) with excessive adjustments (>25%)`
      });
      reviewResults.score -= 0.1;
    }
  } else {
    reviewResults.findings.push({
      severity: 'high',
      section: 'comparables',
      message: 'No comparables provided in the report'
    });
    reviewResults.score -= 0.2;
  }
  
  // Check valuation reasonableness
  if (report.valuation) {
    // Check if valuation is provided but methodology is missing
    if (!report.methodology) {
      reviewResults.findings.push({
        severity: 'medium',
        section: 'methodology',
        message: 'Valuation provided without specified methodology'
      });
      reviewResults.score -= 0.1;
    }
    
    // Check if comps and valuation are consistent
    if (comparables && Array.isArray(comparables) && comparables.length > 0) {
      const compValues = comparables
        .filter(comp => comp.salePrice)
        .map(comp => parseInt(comp.salePrice));
      
      if (compValues.length > 0) {
        const minValue = Math.min(...compValues);
        const maxValue = Math.max(...compValues);
        const valuation = parseInt(report.valuation);
        
        // Check if valuation is outside the range of comparable sale prices by >20%
        if (valuation < minValue * 0.8 || valuation > maxValue * 1.2) {
          reviewResults.findings.push({
            severity: 'high',
            section: 'valuation',
            message: 'Valuation falls significantly outside the range of comparable sales'
          });
          reviewResults.score -= 0.2;
        }
      }
    }
  } else {
    reviewResults.findings.push({
      severity: 'critical',
      section: 'valuation',
      message: 'Report lacks final valuation'
    });
    reviewResults.score -= 0.3;
  }
  
  // Add suggestions for improvement
  if (reviewResults.findings.length > 0) {
    if (reviewResults.findings.some(f => f.section === 'conclusions')) {
      reviewResults.suggestions.push('Add more detailed analysis to support conclusions');
    }
    
    if (reviewResults.findings.some(f => f.section === 'comparables')) {
      reviewResults.suggestions.push('Consider additional comparables or justify current selections');
    }
    
    if (reviewResults.findings.some(f => f.section === 'methodology')) {
      reviewResults.suggestions.push('Clearly explain valuation methodology and adjustments');
    }
  }
  
  // Ensure score is between 0 and 1
  reviewResults.score = Math.max(0, Math.min(1, reviewResults.score));
  
  // Calculate QC outcome
  reviewResults.passed = reviewResults.score >= qcScoreThreshold;
  
  return reviewResults;
}

function reportHasMinimalDescription(report) {
  // Check if conclusions exist and have minimal substance
  if (!report.conclusions || typeof report.conclusions !== 'string') {
    return false;
  }
  
  // Check for minimal length of conclusions
  return report.conclusions.length >= 100;
}

function calculateQcScore(reviewResults) {
  // Count issues by severity
  const criticalCount = reviewResults.filter(r => r.severity === 'critical').length;
  const highCount = reviewResults.filter(r => r.severity === 'high').length;
  const mediumCount = reviewResults.filter(r => r.severity === 'medium').length;
  const lowCount = reviewResults.filter(r => r.severity === 'low').length;
  
  // Calculate score
  let score = 1.0;
  score -= criticalCount * 0.3;  // Critical issues have major impact
  score -= highCount * 0.15;     // High severity issues have significant impact
  score -= mediumCount * 0.1;    // Medium severity has moderate impact
  score -= lowCount * 0.05;      // Low severity has minor impact
  
  return Math.max(0, score);
}

/**
 * Run the market analyzer agent to assess market conditions
 * @param {Object} data - Market data to analyze
 * @param {Object} options - Agent options
 * @returns {Promise<Object>} - Market analysis results
 */
async function runMarketAnalyzer(data, options) {
  const { location, salesData, timeFrame = '6m' } = data;
  
  // Validate inputs
  if (!location || !salesData || !Array.isArray(salesData)) {
    throw new Error('Invalid input for market analysis');
  }
  
  // Calculate market metrics
  const metrics = calculateMarketMetrics(salesData);
  
  // Analyze market trends
  const trends = analyzeMarketTrends(salesData, timeFrame);
  
  // Assess overall market conditions
  const conditions = assessMarketConditions(metrics, trends);
  
  // Generate market summary
  const summary = generateMarketSummary(location, metrics, conditions);
  
  return {
    location,
    timeFrame,
    metrics,
    trends,
    conditions,
    summary,
    timestamp: new Date().toISOString()
  };
}

function calculateMarketMetrics(salesData) {
  // Extract prices
  const prices = salesData
    .filter(sale => sale.salePrice)
    .map(sale => parseInt(sale.salePrice));
  
  // Calculate metrics
  const count = prices.length;
  const totalVolume = prices.reduce((sum, price) => sum + price, 0);
  
  // Handle empty data
  if (count === 0) {
    return {
      count: 0,
      totalVolume: 0,
      averagePrice: 0,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      pricePerSqFt: 0,
      daysOnMarket: 0
    };
  }
  
  // Calculate average and median prices
  const averagePrice = totalVolume / count;
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = count % 2 === 0
    ? (sortedPrices[count/2 - 1] + sortedPrices[count/2]) / 2
    : sortedPrices[Math.floor(count/2)];
  
  // Calculate price range
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Calculate price per square foot (if available)
  let totalSqFt = 0;
  let pricePerSqFtCount = 0;
  let pricePerSqFtSum = 0;
  
  salesData.forEach(sale => {
    if (sale.salePrice && sale.buildingSize) {
      const sqFt = parseInt(sale.buildingSize.replace(/[^0-9]/g, ''));
      if (!isNaN(sqFt) && sqFt > 0) {
        const price = parseInt(sale.salePrice);
        const ppsf = price / sqFt;
        
        pricePerSqFtSum += ppsf;
        pricePerSqFtCount++;
        totalSqFt += sqFt;
      }
    }
  });
  
  const pricePerSqFt = pricePerSqFtCount > 0 ? pricePerSqFtSum / pricePerSqFtCount : 0;
  
  // Calculate average days on market
  const daysOnMarketData = salesData
    .filter(sale => sale.daysOnMarket)
    .map(sale => parseInt(sale.daysOnMarket));
  
  const daysOnMarket = daysOnMarketData.length > 0
    ? daysOnMarketData.reduce((sum, days) => sum + days, 0) / daysOnMarketData.length
    : 0;
  
  return {
    count,
    totalVolume,
    averagePrice: Math.round(averagePrice),
    medianPrice: Math.round(medianPrice),
    minPrice,
    maxPrice,
    pricePerSqFt: Math.round(pricePerSqFt * 100) / 100,
    daysOnMarket: Math.round(daysOnMarket)
  };
}

function analyzeMarketTrends(salesData, timeFrame) {
  // Sort sales by date
  const sortedSales = [...salesData]
    .filter(sale => sale.saleDate && sale.salePrice)
    .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
  
  // Handle insufficient data
  if (sortedSales.length < 2) {
    return {
      priceChange: 0,
      priceChangePercent: 0,
      volumeChange: 0,
      volumeChangePercent: 0,
      daysOnMarketChange: 0,
      inventoryChange: 0
    };
  }
  
  // Determine period divider based on timeFrame
  let periodDivider;
  const now = new Date();
  
  switch (timeFrame) {
    case '1m':
      periodDivider = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case '3m':
      periodDivider = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case '6m':
      periodDivider = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case '1y':
      periodDivider = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      periodDivider = new Date(now.setMonth(now.getMonth() - 6)); // Default to 6 months
  }
  
  // Divide sales into current and previous periods
  const currentPeriodSales = sortedSales.filter(sale => 
    new Date(sale.saleDate) >= periodDivider);
  
  const previousPeriodSales = sortedSales.filter(sale => 
    new Date(sale.saleDate) < periodDivider);
  
  // Handle insufficient data in either period
  if (currentPeriodSales.length === 0 || previousPeriodSales.length === 0) {
    return {
      priceChange: 0,
      priceChangePercent: 0,
      volumeChange: 0,
      volumeChangePercent: 0,
      daysOnMarketChange: 0,
      inventoryChange: 0
    };
  }
  
  // Calculate metrics for current period
  const currentMetrics = calculateMarketMetrics(currentPeriodSales);
  
  // Calculate metrics for previous period
  const previousMetrics = calculateMarketMetrics(previousPeriodSales);
  
  // Calculate changes
  const priceChange = currentMetrics.medianPrice - previousMetrics.medianPrice;
  const priceChangePercent = previousMetrics.medianPrice !== 0
    ? (priceChange / previousMetrics.medianPrice) * 100
    : 0;
    
  const volumeChange = currentMetrics.totalVolume - previousMetrics.totalVolume;
  const volumeChangePercent = previousMetrics.totalVolume !== 0
    ? (volumeChange / previousMetrics.totalVolume) * 100
    : 0;
    
  const daysOnMarketChange = currentMetrics.daysOnMarket - previousMetrics.daysOnMarket;
  const inventoryChange = currentMetrics.count - previousMetrics.count;
  
  return {
    priceChange,
    priceChangePercent: Math.round(priceChangePercent * 10) / 10,
    volumeChange,
    volumeChangePercent: Math.round(volumeChangePercent * 10) / 10,
    daysOnMarketChange,
    inventoryChange
  };
}

function assessMarketConditions(metrics, trends) {
  // Determine market type
  let marketType;
  if (trends.priceChangePercent > 5 && trends.daysOnMarketChange < 0) {
    marketType = 'Seller\'s Market';
  } else if (trends.priceChangePercent < -5 && trends.daysOnMarketChange > 0) {
    marketType = 'Buyer\'s Market';
  } else {
    marketType = 'Balanced Market';
  }
  
  // Determine demand level
  let demand;
  if (trends.daysOnMarketChange < -10) {
    demand = 'High';
  } else if (trends.daysOnMarketChange > 10) {
    demand = 'Low';
  } else {
    demand = 'Moderate';
  }
  
  // Determine price trend
  let priceChange;
  if (trends.priceChangePercent > 10) {
    priceChange = 'Rapidly Increasing';
  } else if (trends.priceChangePercent > 3) {
    priceChange = 'Increasing';
  } else if (trends.priceChangePercent < -10) {
    priceChange = 'Rapidly Decreasing';
  } else if (trends.priceChangePercent < -3) {
    priceChange = 'Decreasing';
  } else {
    priceChange = 'Stable';
  }
  
  // Determine overall condition
  const overallCondition = getOverallCondition(marketType, demand, priceChange);
  
  return {
    marketType,
    demand,
    priceChange,
    overallCondition
  };
}

function getOverallCondition(marketType, demand, priceChange) {
  // Determine overall market strength on a scale
  if (marketType === 'Seller\'s Market' && demand === 'High' && 
     (priceChange === 'Rapidly Increasing' || priceChange === 'Increasing')) {
    return 'Hot Market';
  }
  
  if (marketType === 'Buyer\'s Market' && demand === 'Low' && 
     (priceChange === 'Rapidly Decreasing' || priceChange === 'Decreasing')) {
    return 'Cold Market';
  }
  
  if (marketType === 'Balanced Market' && demand === 'Moderate' && priceChange === 'Stable') {
    return 'Neutral Market';
  }
  
  if ((marketType === 'Seller\'s Market' || demand === 'High') && 
      (priceChange === 'Increasing' || priceChange === 'Stable')) {
    return 'Strong Market';
  }
  
  if ((marketType === 'Buyer\'s Market' || demand === 'Low') && 
      (priceChange === 'Decreasing' || priceChange === 'Stable')) {
    return 'Weak Market';
  }
  
  return 'Mixed Market';
}

function generateMarketSummary(location, metrics, conditions) {
  const summary = `
Market Analysis for ${location}:

The ${location} real estate market is currently a ${conditions.overallCondition}. 
It can be characterized as a ${conditions.marketType} with ${conditions.demand} demand 
and ${conditions.priceChange} prices.

Key metrics:
- Median sale price: ${formatCurrency(metrics.medianPrice)}
- Average price per square foot: ${formatCurrency(metrics.pricePerSqFt)}
- Average days on market: ${metrics.daysOnMarket} days
- Total sales volume: ${metrics.count} properties 

This analysis is based on recent market activity and local economic indicators.
`.trim();

  return summary;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export {
  initializeAgents,
  runAgent,
  runDataValidator,
  runCompSelector,
  runQCReviewer,
  runMarketAnalyzer
};