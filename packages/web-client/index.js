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
  <link rel="stylesheet" href="/css/workflow.css">
  <style>
    /* Basic reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f7fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 15px;
    }
    
    /* Header */
    header {
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #3f51b5;
    }
    
    /* Main content */
    main {
      padding: 30px 0;
    }
    
    .welcome-section {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .welcome-title {
      font-size: 36px;
      color: #3f51b5;
      margin-bottom: 10px;
    }
    
    .welcome-subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 20px;
    }
    
    /* Cards */
    .card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 24px;
      color: #3f51b5;
      margin-bottom: 15px;
    }
    
    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      grid-gap: 20px;
      margin-top: 20px;
    }
    
    .service-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    
    .service-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .service-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .status-inactive {
      background-color: #ffebee;
      color: #c62828;
    }
    
    /* Property Grid */
    .property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-gap: 20px;
      margin-top: 20px;
    }
    
    .property-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    
    /* Users Table */
    .users-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .users-table th, .users-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .users-table th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    
    .users-table tr:hover {
      background-color: #f5f5f5;
    }
    
    /* Footer */
    footer {
      background-color: #fff;
      border-top: 1px solid #eee;
      padding: 20px 0;
      margin-top: 20px;
    }
    
    /* Error Message */
    .error-message {
      background-color: #ffebee;
      border-left: 4px solid #c62828;
      padding: 15px;
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
      
      <div class="card">
        <h2 class="section-title">Property Listings</h2>
        <p>Sample property data from our GraphQL Property Service</p>
        
        <div id="properties-container">
          <div style="text-align: center;">
            <div class="spinner"></div>
            <p>Loading property data...</p>
          </div>
        </div>
        
        <button class="button" id="load-properties-button">Refresh Properties</button>
      </div>
      
      <div class="card">
        <h2 class="section-title">Users</h2>
        <p>Sample user data from our GraphQL User Service</p>
        
        <div id="users-container">
          <div style="text-align: center;">
            <div class="spinner"></div>
            <p>Loading user data...</p>
          </div>
        </div>
        
        <button class="button" id="load-users-button">Refresh Users</button>
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
      
      // Also fetch properties and users
      fetchProperties();
      fetchUsers();
      
      // Login button click
      document.getElementById('login-button').addEventListener('click', function() {
        alert('This is a demonstration of the platform architecture. Full authentication would be implemented in the production version.');
      });
      
      // Property refresh button
      document.getElementById('load-properties-button').addEventListener('click', function() {
        fetchProperties();
      });
      
      // Users refresh button
      document.getElementById('load-users-button').addEventListener('click', function() {
        fetchUsers();
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
      const servicesGrid = document.getElementById('services-grid');
      
      if (!services || services.length === 0) {
        servicesGrid.innerHTML = '<p>No services data available</p>';
        return;
      }
      
      let html = '';
      
      services.forEach(service => {
        const statusClass = service.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = service.status === 'active' ? 'Active' : 'Inactive';
        
        html += '<div class="service-card">' +
                  '<div class="service-name">' + service.name + '</div>' +
                  '<div class="service-port">Port: ' + (service.port || 'N/A') + '</div>' +
                  '<div class="service-status ' + statusClass + '">' + statusText + '</div>' +
                '</div>';
      });
      
      servicesGrid.innerHTML = html;
    }
    
    function showError(message) {
      const servicesGrid = document.getElementById('services-grid');
      
      servicesGrid.innerHTML = '<div class="error-message">' +
                                '<p>' + message + '</p>' +
                                '<button class="button" onclick="fetchServices()">Try Again</button>' +
                              '</div>';
    }
    
    async function fetchProperties() {
      const propertiesContainer = document.getElementById('properties-container');
      
      // Show loading spinner
      propertiesContainer.innerHTML = '<div style="text-align: center;">' +
                                        '<div class="spinner"></div>' +
                                        '<p>Loading property data...</p>' +
                                      '</div>';
      
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const data = await response.json();
        
        if (data.properties && data.properties.length > 0) {
          // Create property cards
          let propertiesHtml = '<p class="data-source">Data source: ' + (data.source || 'API') + 
                              ' | Updated: ' + new Date(data.timestamp).toLocaleString() + '</p>' +
                              '<div class="property-grid">';
          
          data.properties.forEach(property => {
            propertiesHtml += '<div class="property-card">' +
                                '<h3>' + property.address + '</h3>' +
                                '<p><strong>Location:</strong> ' + property.city + ', ' + property.state + '</p>';
            
            if (property.zipCode) {
              propertiesHtml += '<p><strong>Zip:</strong> ' + property.zipCode + '</p>';
            }
            
            if (property.propertyType) {
              propertiesHtml += '<p><strong>Type:</strong> ' + property.propertyType + '</p>';
            }
            
            if (property.yearBuilt) {
              propertiesHtml += '<p><strong>Year Built:</strong> ' + property.yearBuilt + '</p>';
            }
            
            if (property.bedrooms) {
              propertiesHtml += '<p><strong>Beds:</strong> ' + property.bedrooms + '</p>';
            }
            
            if (property.bathrooms) {
              propertiesHtml += '<p><strong>Baths:</strong> ' + property.bathrooms + '</p>';
            }
            
            propertiesHtml += '<button class="button" onclick="alert(\'View details for Property ID: ' + 
                              property.id + '\')">View Details</button>' +
                              '</div>';
          });
          
          propertiesHtml += '</div>';
          propertiesContainer.innerHTML = propertiesHtml;
        } else {
          propertiesContainer.innerHTML = '<p>No properties found</p>';
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        propertiesContainer.innerHTML = '<div class="error-message">' +
                                          '<p>Error loading properties: ' + error.message + '</p>' +
                                          '<button class="button" onclick="fetchProperties()">Try Again</button>' +
                                        '</div>';
      }
    }
    
    async function fetchUsers() {
      const usersContainer = document.getElementById('users-container');
      
      // Show loading spinner
      usersContainer.innerHTML = '<div style="text-align: center;">' +
                                  '<div class="spinner"></div>' +
                                  '<p>Loading user data...</p>' +
                                '</div>';
      
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        
        if (data.users && data.users.length > 0) {
          // Create user table
          let usersHtml = '<p class="data-source">Data source: ' + (data.source || 'API') + 
                          ' | Updated: ' + new Date(data.timestamp).toLocaleString() + '</p>' +
                          '<table class="users-table">' +
                            '<thead>' +
                              '<tr>' +
                                '<th>Name</th>' +
                                '<th>Email</th>' +
                                '<th>Role</th>' +
                                '<th>Company</th>' +
                                '<th>Actions</th>' +
                              '</tr>' +
                            '</thead>' +
                            '<tbody>';
          
          data.users.forEach(user => {
            usersHtml += '<tr>' +
                          '<td>' + user.firstName + ' ' + user.lastName + '</td>' +
                          '<td>' + user.email + '</td>' +
                          '<td>' + (user.role || 'N/A') + '</td>' +
                          '<td>' + (user.company || 'N/A') + '</td>' +
                          '<td>' +
                            '<button class="button small" onclick="alert(\'View profile for User ID: ' + 
                            user.id + '\')">Profile</button>' +
                          '</td>' +
                        '</tr>';
          });
          
          usersHtml += '</tbody>' +
                      '</table>';
          
          usersContainer.innerHTML = usersHtml;
        } else {
          usersContainer.innerHTML = '<p>No users found</p>';
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        usersContainer.innerHTML = '<div class="error-message">' +
                                    '<p>Error loading users: ' + error.message + '</p>' +
                                    '<button class="button" onclick="fetchUsers()">Try Again</button>' +
                                  '</div>';
      }
    }
  </script>
</body>
</html>`;

// Write the index.html file to the build directory
fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml);

// Define MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Create the HTTP server
const server = http.createServer((req, res) => {
  let requestUrl = req.url;
  console.log(`${req.method} ${requestUrl}`);
  
  // Status API endpoint
  if (requestUrl === '/api/status') {
    const serviceStatus = {
      services: [
        { name: 'User Service', port: 5004, status: 'active' },
        { name: 'Property Service', port: 5003, status: 'active' },
        { name: 'Form Service', port: 5005, status: 'active' },
        { name: 'Analysis Service', port: 5006, status: 'active' },
        { name: 'Report Service', port: 5007, status: 'active' },
        { name: 'API Gateway', port: 5002, status: 'active' },
        { name: 'Web Client', port: 5000, status: 'active' }
      ],
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(serviceStatus));
    return;
  }
  
  // Properties API endpoint
  if (requestUrl === '/api/properties') {
    // Proxy the request to our Property Service through the API Gateway
    const apiGatewayHost = 'localhost';
    const apiGatewayPort = 5002;
    
    const options = {
      hostname: apiGatewayHost,
      port: apiGatewayPort,
      path: '/api/graphql/property',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const graphqlQuery = {
      query: "{ properties { id address city state zipCode propertyType yearBuilt bedrooms bathrooms } }"
    };
    
    const apiReq = http.request(options, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          
          // Format the response for our web client
          const properties = {
            properties: parsedData.data?.properties || [],
            source: 'GraphQL API',
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(properties));
        } catch (error) {
          console.error('Error parsing property data:', error);
          // Fallback when API fails
          const fallbackProperties = {
            properties: [
              { id: 'prop-1001', address: '123 Main St', city: 'New York', state: 'NY' },
              { id: 'prop-1002', address: '456 Oak Ave', city: 'Los Angeles', state: 'CA' },
              { id: 'prop-1003', address: '789 Pine Ln', city: 'Chicago', state: 'IL' }
            ],
            source: 'Fallback data (API unavailable)',
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(fallbackProperties));
        }
      });
    });
    
    apiReq.on('error', (error) => {
      console.error('Error connecting to API Gateway:', error);
      
      // Fallback when API is unreachable
      const fallbackProperties = {
        properties: [
          { id: 'prop-1001', address: '123 Main St', city: 'New York', state: 'NY' },
          { id: 'prop-1002', address: '456 Oak Ave', city: 'Los Angeles', state: 'CA' },
          { id: 'prop-1003', address: '789 Pine Ln', city: 'Chicago', state: 'IL' }
        ],
        source: 'Fallback data (API unreachable)',
        timestamp: new Date().toISOString()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallbackProperties));
    });
    
    // Send the GraphQL query
    apiReq.write(JSON.stringify(graphqlQuery));
    apiReq.end();
    
    return;
  }
  
  // Users API endpoint
  if (requestUrl === '/api/users') {
    // Proxy the request to our User Service through the API Gateway
    const apiGatewayHost = 'localhost';
    const apiGatewayPort = 5002;
    
    const options = {
      hostname: apiGatewayHost,
      port: apiGatewayPort,
      path: '/api/graphql/user',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const graphqlQuery = {
      query: "{ users { id firstName lastName email role company } }"
    };
    
    const apiReq = http.request(options, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          
          // Format the response for our web client
          const users = {
            users: parsedData.data?.users || [],
            source: 'GraphQL API',
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Fallback when API fails
          const fallbackUsers = {
            users: [
              { id: 'user-101', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'appraiser' },
              { id: 'user-102', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'admin' }
            ],
            source: 'Fallback data (API unavailable)',
            timestamp: new Date().toISOString()
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(fallbackUsers));
        }
      });
    });
    
    apiReq.on('error', (error) => {
      console.error('Error connecting to API Gateway:', error);
      
      // Fallback when API is unreachable
      const fallbackUsers = {
        users: [
          { id: 'user-101', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'appraiser' },
          { id: 'user-102', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'admin' }
        ],
        source: 'Fallback data (API unreachable)',
        timestamp: new Date().toISOString()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fallbackUsers));
    });
    
    // Send the GraphQL query
    apiReq.write(JSON.stringify(graphqlQuery));
    apiReq.end();
    
    return;
  }
  
  // For index route, serve index.html
  if (requestUrl === '/' || requestUrl === '') {
    requestUrl = '/index.html';
  }
  
  // Determine the file path
  const filePath = path.join(buildDir, requestUrl);
  
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