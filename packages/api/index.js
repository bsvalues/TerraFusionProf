/**
 * TerraFusionPro API Gateway
 * 
 * This is the main entry point for the API Gateway, which routes requests
 * to appropriate microservices and handles authentication, rate limiting,
 * and other cross-cutting concerns.
 * 
 * This implementation uses Node.js http module directly to avoid dependency issues.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';
import jwt from 'jsonwebtoken';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port and configuration
const PORT = process.env.API_GATEWAY_PORT || 5002;
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

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  
  // Log the request
  console.log(`${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle root health check
  if (req.url === '/' || req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'API Gateway is running',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Handle API health check
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Find the target service for this route
  const routeKey = Object.keys(serviceRoutes).find(route => req.url.startsWith(route));
  
  if (!routeKey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Service not found for this route' }));
    return;
  }
  
  // Check authentication for protected routes
  if (!publicRoutes.some(route => req.url.startsWith(route))) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authentication token required' }));
      return;
    }
    
    try {
      // Verify JWT token
      const user = jwt.verify(token, JWT_SECRET);
      
      // Add user info to headers
      req.headers['x-user-id'] = user.id;
      req.headers['x-user-role'] = user.role;
      req.headers['x-user-email'] = user.email;
    } catch (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or expired token' }));
      return;
    }
  }
  
  // Forward the request to the target service
  const targetUrl = serviceRoutes[routeKey];
  const serviceUrl = new URL(req.url.replace(routeKey, ''), targetUrl);
  
  // Get request body if POST/PUT
  let requestBody = '';
  if (req.method === 'POST' || req.method === 'PUT') {
    await new Promise((resolve) => {
      req.on('data', chunk => {
        requestBody += chunk.toString();
      });
      req.on('end', resolve);
    });
  }
  
  // Proxy configuration
  const proxyOptions = {
    hostname: serviceUrl.hostname,
    port: serviceUrl.port,
    path: serviceUrl.pathname + serviceUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: serviceUrl.host
    }
  };
  
  console.log(`Proxying ${req.method} ${req.url} to ${targetUrl}${serviceUrl.pathname}`);
  
  // Create proxy request
  const proxyReq = http.request(proxyOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });
    
    proxyRes.on('end', () => {
      const duration = Date.now() - startTime;
      console.log(`${req.method} ${req.url} ${proxyRes.statusCode} ${duration}ms`);
      res.end();
    });
  });
  
  // Handle errors
  proxyReq.on('error', (error) => {
    console.error('Proxy request error:', error);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Service unavailable', details: error.message }));
  });
  
  // Send request body if any
  if (requestBody) {
    proxyReq.write(requestBody);
  }
  
  proxyReq.end();
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  
  // Print out server address info to confirm binding
  const addressInfo = server.address();
  console.log(`Server successfully bound to ${addressInfo.address}:${addressInfo.port}`);
  
  // Create test request to keep the server active
  const testEndpoints = () => {
    // Make a request to the root endpoint to test the server
    http.get(`http://localhost:${PORT}/api/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Health check response:', data);
      });
    }).on('error', (err) => {
      console.error('Health check failed:', err.message);
    });
  };
  
  // Run test immediately and then every 10 seconds
  testEndpoints();
  setInterval(testEndpoints, 10000);
});

export default server;