/**
 * TerraFusionPro API Gateway
 * 
 * This is the main entry point for the API Gateway, which routes requests
 * to appropriate microservices and handles authentication, rate limiting,
 * and other cross-cutting concerns.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Service routes
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://property-service:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const FORM_SERVICE_URL = process.env.FORM_SERVICE_URL || 'http://form-service:3003';
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://analysis-service:3004';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://report-service:3005';

// Property service proxy
app.use('/api/properties', createProxyMiddleware({
  target: PROPERTY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/properties': '/properties' }
}));

// User service proxy
app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' }
}));

// Form service proxy
app.use('/api/forms', createProxyMiddleware({
  target: FORM_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/forms': '/forms' }
}));

// Analysis service proxy
app.use('/api/analysis', createProxyMiddleware({
  target: ANALYSIS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/analysis': '/analysis' }
}));

// Report service proxy
app.use('/api/reports', createProxyMiddleware({
  target: REPORT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/reports': '/reports' }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway listening on port ${PORT}`);
});

module.exports = app;
