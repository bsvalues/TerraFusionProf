/**
 * TerraFusionPro Shared Package
 * 
 * This package contains shared utilities, types, and components that are used
 * across multiple packages in the TerraFusionPro monorepo.
 */

// Export shared utilities
const validation = require('./validation');
const formatting = require('./formatting');
const dataTransforms = require('./dataTransforms');
const constants = require('./constants');
const hooks = require('./hooks');
const api = require('./api');

// Type definitions would be in separate .d.ts files

module.exports = {
  validation,
  formatting,
  dataTransforms,
  constants,
  hooks,
  api,
  
  // Common utility functions
  convertUnits: (value, fromUnit, toUnit) => {
    // Implementation of unit conversion (e.g., sq ft to sq m)
    return dataTransforms.convertUnits(value, fromUnit, toUnit);
  },

  formatCurrency: (value, currencyCode = 'USD', options = {}) => {
    // Format numeric values as currency
    return formatting.formatCurrency(value, currencyCode, options);
  },

  validatePropertyData: (propertyData) => {
    // Validate property data against schema
    return validation.validatePropertyData(propertyData);
  },

  // Common components would be exported here if this were a TypeScript project
  // with React components
};

// This file serves as the main entry point for the shared package
console.log('TerraFusionPro Shared package initialized');
