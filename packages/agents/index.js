/**
 * TerraFusionPro AI Agents
 * 
 * This package contains AI agent implementations for data validation,
 * analysis, and quality control within the TerraFusionPro platform.
 */

const propertyValidationAgent = require('./agents/propertyValidationAgent');
const comparableSelectionAgent = require('./agents/comparableSelectionAgent');
const dataQualityAgent = require('./agents/dataQualityAgent');
const reportProofingAgent = require('./agents/reportProofingAgent');
const marketAnalysisAgent = require('./agents/marketAnalysisAgent');

// Agent orchestration system
const agentSystem = require('./core/agentSystem');

/**
 * Initialize the agent system with configuration
 * @param {Object} config - Configuration options for the agent system
 * @returns {Object} - The initialized agent system
 */
function initializeAgents(config = {}) {
  console.log('Initializing TerraFusionPro AI Agents...');
  return agentSystem.initialize(config);
}

/**
 * Run a specific agent with provided data
 * @param {string} agentType - Type of agent to run
 * @param {Object} data - Data for the agent to process
 * @param {Object} options - Additional options for the agent
 * @returns {Promise<Object>} - Results from the agent
 */
async function runAgent(agentType, data, options = {}) {
  console.log(`Running agent: ${agentType}`);
  switch (agentType) {
    case 'property-validation':
      return propertyValidationAgent.validate(data, options);
    case 'comparable-selection':
      return comparableSelectionAgent.selectComparables(data, options);
    case 'data-quality':
      return dataQualityAgent.analyzeQuality(data, options);
    case 'report-proofing':
      return reportProofingAgent.proofReport(data, options);
    case 'market-analysis':
      return marketAnalysisAgent.analyzeMarket(data, options);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

module.exports = {
  initializeAgents,
  runAgent,
  agents: {
    propertyValidation: propertyValidationAgent,
    comparableSelection: comparableSelectionAgent,
    dataQuality: dataQualityAgent,
    reportProofing: reportProofingAgent,
    marketAnalysis: marketAnalysisAgent
  },
  system: agentSystem
};
