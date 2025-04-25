/**
 * TerraFusionPro API Gateway
 * 
 * This is a simple API Gateway using Node.js http module.
 */

import http from 'http';
import url from 'url';

// Service URLs with default localhost fallbacks
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5004';
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:5003';
const FORM_SERVICE_URL = process.env.FORM_SERVICE_URL || 'http://localhost:5005';
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:5006';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:5007';

const PORT = process.env.API_GATEWAY_PORT || 5002;

// Create server
const server = http.createServer((req, res) => {
  // Parse the request URL
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Log request
  console.log(`${req.method} ${path}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Health check endpoint
  if (path === '/api/health') {
    const response = {
      status: 'healthy',
      service: 'api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
    
    console.log('Health check response:', JSON.stringify(response));
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
    return;
  }
  
  // API Version endpoint
  if (path === '/api/version') {
    const response = {
      version: '1.0.0',
      apiVersion: 'v1',
      name: 'TerraFusionPro API Gateway',
      timestamp: new Date().toISOString()
    };
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
    return;
  }
  
  // Route requests to appropriate services
  let targetUrl = null;
  
  // User service routes
  if (path.startsWith('/api/users')) {
    targetUrl = USER_SERVICE_URL + path.replace('/api/users', '');
  }
  // Property service routes
  else if (path.startsWith('/api/properties')) {
    targetUrl = PROPERTY_SERVICE_URL + path.replace('/api/properties', '/properties');
  }
  // Form service routes
  else if (path.startsWith('/api/forms')) {
    targetUrl = FORM_SERVICE_URL + path.replace('/api/forms', '/forms');
  }
  // Analysis service routes
  else if (path.startsWith('/api/analysis')) {
    targetUrl = ANALYSIS_SERVICE_URL + path.replace('/api/analysis', '');
  }
  // Report service routes
  else if (path.startsWith('/api/reports')) {
    targetUrl = REPORT_SERVICE_URL + path.replace('/api/reports', '/reports');
  }
  // Auth routes
  else if (path === '/api/auth/login') {
    targetUrl = USER_SERVICE_URL + '/login';
  }
  else if (path === '/api/auth/register') {
    targetUrl = USER_SERVICE_URL + '/register';
  }
  else if (path === '/api/auth/me') {
    targetUrl = USER_SERVICE_URL + '/me';
  }
  else if (path === '/api/auth/change-password') {
    targetUrl = USER_SERVICE_URL + '/change-password';
  }
  
  // If a route match was found, proxy the request
  if (targetUrl) {
    proxyRequest(req, res, targetUrl, parsedUrl.search || '');
  } else {
    // Handle 404 for unmatched routes
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Path ${path} does not exist on this server`,
      timestamp: new Date().toISOString()
    }));
  }
});

// Function to proxy requests to the target service
function proxyRequest(req, res, targetUrl, queryString = '') {
  // Parse the target URL
  const target = new URL(targetUrl + queryString);
  
  console.log(`Proxying to: ${target.href}`);
  
  // Options for the proxied request
  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: target.host,
    }
  };
  
  // Create the proxied request
  const proxyReq = http.request(options, (proxyRes) => {
    // Forward the status code
    res.statusCode = proxyRes.statusCode;
    
    // Forward the headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Forward the response data
    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });
    
    proxyRes.on('end', () => {
      res.end();
    });
  });
  
  // Handle errors in the proxied request
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: 'The requested service is unavailable',
      timestamp: new Date().toISOString()
    }));
  });
  
  // Forward the request body if present
  req.on('data', (chunk) => {
    proxyReq.write(chunk);
  });
  
  req.on('end', () => {
    proxyReq.end();
  });
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Server successfully bound to 0.0.0.0:' + PORT);
});

export default server;