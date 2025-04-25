/**
 * TerraFusionPro API Gateway
 * 
 * This is the main entry point for the API Gateway, which routes requests
 * to appropriate microservices and handles authentication, rate limiting,
 * and other cross-cutting concerns.
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.API_GATEWAY_PORT || 5002;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusionpro-secret-key';

// Public routes that don't require authentication
const publicRoutes = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register'
];

// Route-to-service mapping
const serviceRoutes = {
  '/api/users': 'http://localhost:5000',
  '/api/auth': 'http://localhost:5000',
  '/api/properties': 'http://localhost:5001',
  '/api/comparables': 'http://localhost:5003',
  '/api/market': 'http://localhost:5003',
  '/api/forms': 'http://localhost:5005',
  '/api/submissions': 'http://localhost:5005',
  '/api/reports': 'http://localhost:5004'
};

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

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  // Skip authentication for public routes
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Add user info to request for downstream services
    req.headers['x-user-id'] = user.id;
    req.headers['x-user-role'] = user.role;
    req.headers['x-user-email'] = user.email;
    
    next();
  });
};

// Rate limiting middleware (simple implementation)
const rateLimit = (req, res, next) => {
  // In a real implementation, this would use Redis or another shared store
  // to keep track of request counts across instances
  
  // For this simplified version, we'll just pass through all requests
  next();
};

// Apply global middleware
app.use(logRequest);
app.use(authenticateRequest);
app.use(rateLimit);

// Gateway health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Set up proxies to each service
Object.entries(serviceRoutes).forEach(([route, target]) => {
  app.use(route, createProxyMiddleware({
    target,
    pathRewrite: {
      [`^${route}`]: '', // Remove the /api/<service> prefix when proxying
    },
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request
      console.log(`Proxying ${req.method} ${req.path} to ${target}`);
    }
  }));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  
  // Print out server address info to confirm binding
  const addressInfo = server.address();
  console.log(`Server successfully bound to ${addressInfo.address}:${addressInfo.port}`);
});

// Add basic health check on root endpoint to confirm the server is responsive
app.get('/', (req, res) => {
  res.json({
    status: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

export default app;