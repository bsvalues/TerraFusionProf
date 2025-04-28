/**
 * TerraFusionPro Web Client
 * 
 * This is the entry point for the web client application.
 * It sets up a pure Node.js HTTP server to serve a simple status dashboard.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Setup directories
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const cssBuildDir = path.join(buildDir, 'css');
if (!fs.existsSync(cssBuildDir)) {
  fs.mkdirSync(cssBuildDir, { recursive: true });
}

// Create CSS directory in build and copy CSS files
const srcStylesDir = path.join(__dirname, 'src', 'styles');
if (fs.existsSync(srcStylesDir)) {
  const files = fs.readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
  files.forEach(file => {
    const src = path.join(srcStylesDir, file);
    const dest = path.join(cssBuildDir, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  });
}

// Create the index.html file
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TerraFusionPro - Real Estate Appraisal Platform</title>
  <link rel="stylesheet" href="/css/global.css">
  <link rel="stylesheet" href="/css/property.css">
  <style>
    /* Basic reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    
    /* Layout */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background-color: #3f51b5;
      color: white;
      padding: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
    }
    
    main {
      padding: 40px 0;
    }
    
    footer {
      background-color: #f9f9f9;
      padding: 20px 0;
      border-top: 1px solid #eee;
      margin-top: 40px;
    }
    
    /* Components */
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .section-title {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .service-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      border-left: 4px solid #3f51b5;
    }
    
    .service-card.healthy {
      border-left-color: #4caf50;
    }
    
    .service-card.warning {
      border-left-color: #ff9800;
    }
    
    .service-card.error {
      border-left-color: #f44336;
    }
    
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .service-name {
      font-weight: 600;
      margin: 0;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-size: 14px;
      margin: 10px 0;
    }
    
    .status-circle {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    .status-indicator.healthy .status-circle {
      background-color: #4caf50;
    }
    
    .status-indicator.warning .status-circle {
      background-color: #ff9800;
    }
    
    .status-indicator.error .status-circle {
      background-color: #f44336;
    }
    
    .service-details {
      font-size: 14px;
      color: #666;
    }
    
    /* Welcome Section */
    .welcome-section {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .welcome-title {
      font-size: 36px;
      margin-bottom: 10px;
      color: #3f51b5;
    }
    
    .welcome-subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 20px;
    }
    
    /* Buttons */
    .button {
      display: inline-block;
      background-color: #3f51b5;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-top: 10px;
    }
    
    .button:hover {
      background-color: #303f9f;
    }
    
    /* Loading Spinner */
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left: 4px solid #3f51b5;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo">TerraFusionPro</div>
      </div>
    </div>
  </header>

  <main>
    <div class="container">
      <div class="welcome-section">
        <h1 class="welcome-title">Welcome to TerraFusionPro</h1>
        <p class="welcome-subtitle">Advanced Real Estate Appraisal Platform</p>
        <button class="button" id="login-button">Login Demo</button>
      </div>
      
      <div class="card">
        <h2 class="section-title">System Status</h2>
        <p>Current status of all microservices in the TerraFusionPro platform.</p>
        
        <div class="services-grid" id="services-grid">
          <div style="text-align: center;">
            <div class="spinner"></div>
            <p>Loading services status...</p>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2023-2025 TerraFusionPro. All rights reserved.</p>
    </div>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Fetch service status
      fetchServices();
      
      // Login button click
      document.getElementById('login-button').addEventListener('click', function() {
        alert('This is a demonstration of the platform architecture. Full authentication would be implemented in the production version.');
      });
    });
    
    async function fetchServices() {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch service status');
        }
        
        const data = await response.json();
        updateServicesGrid(data.services);
      } catch (error) {
        console.error('Error fetching services:', error);
        showError('Unable to load services status. Please try again later.');
      }
    }
    
    function updateServicesGrid(services) {
      const grid = document.getElementById('services-grid');
      if (!services || services.length === 0) {
        grid.innerHTML = '<p>No services found.</p>';
        return;
      }
      
      grid.innerHTML = '';
      
      services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card ' + service.status;
        
        card.innerHTML = \`
          <div class="service-header">
            <h3 class="service-name">\${service.name}</h3>
          </div>
          
          <div class="status-indicator \${service.status}">
            <span class="status-circle"></span>
            <span>\${service.status === 'healthy' ? 'Healthy' : service.status === 'warning' ? 'Warning' : 'Error'}</span>
          </div>
          
          <div class="service-details">
            <p>Endpoint: \${service.endpoint || 'N/A'}</p>
          </div>
        \`;
        
        grid.appendChild(card);
      });
    }
    
    function showError(message) {
      const grid = document.getElementById('services-grid');
      grid.innerHTML = \`
        <div style="text-align: center; padding: 20px;">
          <p style="color: #f44336;">\${message}</p>
        </div>
      \`;
    }
  </script>
</body>
</html>`;

// Write the index.html file
fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml);

// Define simple MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create the HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Parse the URL and get the pathname
  let url = req.url;
  
  // Health check endpoint
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'web-client' }));
    return;
  }
  
  // API status endpoint
  if (url === '/api/status') {
    const serviceStatus = {
      services: [
        { id: 'user-service', name: 'User Service', status: 'healthy', endpoint: '/api/users' },
        { id: 'property-service', name: 'Property Service', status: 'healthy', endpoint: '/api/properties' },
        { id: 'report-service', name: 'Report Service', status: 'healthy', endpoint: '/api/reports' },
        { id: 'form-service', name: 'Form Service', status: 'healthy', endpoint: '/api/forms' },
        { id: 'analysis-service', name: 'Analysis Service', status: 'healthy', endpoint: '/api/analysis' },
        { id: 'gateway', name: 'API Gateway', status: 'healthy', endpoint: '/api' },
        { id: 'apollo-gateway', name: 'Apollo Federation Gateway', status: 'healthy', endpoint: '/graphql' }
      ]
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(serviceStatus));
    return;
  }
  
  // Properties API endpoint (demo)
  if (url === '/api/properties') {
    const properties = {
      properties: [
        { id: 'prop-1001', address: '123 Main St', city: 'New York', state: 'NY' },
        { id: 'prop-1002', address: '456 Oak Ave', city: 'Los Angeles', state: 'CA' },
        { id: 'prop-1003', address: '789 Pine Ln', city: 'Chicago', state: 'IL' }
      ]
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(properties));
    return;
  }
  
  // For index route, serve index.html
  if (url === '/' || url === '') {
    url = '/index.html';
  }
  
  // Determine the file path
  const filePath = path.join(buildDir, url);
  
  // Get the file extension
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If the file doesn't exist, serve index.html (SPA fallback)
        fs.readFile(path.join(buildDir, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success - return the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraFusionPro Web Client running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});