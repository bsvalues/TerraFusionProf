/**
 * TerraFusionPro Web Client - Static File Server
 * 
 * Simple HTTP server using Node.js http module with ES modules
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 5000;

// MIME types for different file extensions
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// Get the current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory for the web client
const webClientDir = __dirname;

// Public directory for static files
const publicDir = path.join(webClientDir, 'public');

// API Gateway URL for proxying
const API_GATEWAY_URL = 'http://localhost:5002';

// Ensure the public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to proxy requests to the API Gateway
function proxyRequest(req, res, targetUrl) {
  const url = new URL(targetUrl);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: url.host
    }
  };
  
  console.log(`Proxying to API Gateway: ${targetUrl}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: 'Failed to proxy request to API Gateway',
      details: err.message
    }));
  });
  
  req.pipe(proxyReq);
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Check if this is an API request
  if (req.url.startsWith('/api/')) {
    // Proxy to API Gateway
    proxyRequest(req, res, `${API_GATEWAY_URL}${req.url}`);
    return;
  }
  
  // Parse the URL for static files
  let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url);
  
  // Get the file extension
  const extname = path.extname(filePath);
  
  // Default content type
  let contentType = 'text/html';
  
  // Set content type based on file extension
  if (extname in CONTENT_TYPES) {
    contentType = CONTENT_TYPES[extname];
  }
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If the file doesn't exist, check if it's a direct route (SPA support)
        if (extname === '') {
          // Serve index.html for all routes without file extensions (SPA)
          fs.readFile(path.join(publicDir, 'index.html'), (err, content) => {
            if (err) {
              res.writeHead(500);
              res.end('Server Error: Could not find index.html');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf8');
          });
        } else {
          // File not found
          res.writeHead(404);
          res.end('Not Found');
        }
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf8');
    }
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraFusionPro Web Client running on port ${PORT}`);
});