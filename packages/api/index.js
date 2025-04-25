/**
 * TerraFusionPro API Gateway
 * 
 * This is the main entry point for the API Gateway, which routes requests
 * to appropriate microservices and handles authentication, rate limiting,
 * and other cross-cutting concerns.
 */

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';

// Service URLs (would come from environment variables or service discovery in production)
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:5001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:5003';
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:5004';
const FORM_SERVICE_URL = process.env.FORM_SERVICE_URL || 'http://localhost:5005';

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticate = (req, res, next) => {
  // Skip auth for some paths
  const publicPaths = ['/api/health', '/api/auth/login', '/api/auth/register'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Check for token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// API Gateway info endpoint
app.get('/api/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Gateway routes and proxy configuration
app.use('/api', authenticate);

// Property service routes
app.use('/api/properties', createProxyMiddleware({
  target: PROPERTY_SERVICE_URL,
  pathRewrite: { '^/api/properties': '/properties' },
  changeOrigin: true
}));

// User service routes 
app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: { '^/api/users': '/users' },
  changeOrigin: true
}));

// Authentication routes (handled by user service)
app.use('/api/auth', createProxyMiddleware({
  target: USER_SERVICE_URL,
  pathRewrite: { '^/api/auth': '/auth' },
  changeOrigin: true
}));

// Report service routes
app.use('/api/reports', createProxyMiddleware({
  target: REPORT_SERVICE_URL,
  pathRewrite: { '^/api/reports': '/reports' },
  changeOrigin: true
}));

// Analysis service routes
app.use('/api/analysis', createProxyMiddleware({
  target: ANALYSIS_SERVICE_URL,
  pathRewrite: { '^/api/analysis': '/analysis' },
  changeOrigin: true
}));

// Form service routes
app.use('/api/forms', createProxyMiddleware({
  target: FORM_SERVICE_URL,
  pathRewrite: { '^/api/forms': '/forms' },
  changeOrigin: true
}));

// Catch all unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found - No matching API route' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;