/**
 * TerraFusionPro Web Client
 * 
 * This is a simple web client for the TerraFusionPro platform.
 * It provides a basic dashboard for accessing platform features.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.WEB_CLIENT_PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Main dashboard page
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TerraFusionPro - Real Estate Appraisal Platform</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: #f4f7f9;
        }
        header {
          background-color: #2c3e50;
          color: white;
          padding: 1rem;
          text-align: center;
        }
        nav {
          background-color: #34495e;
          padding: 0.5rem;
        }
        nav ul {
          list-style-type: none;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
        }
        nav li {
          margin: 0 1rem;
        }
        nav a {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        nav a:hover {
          background-color: #2c3e50;
        }
        .container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        .dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .card-header {
          background-color: #3498db;
          color: white;
          padding: 1rem;
          font-weight: bold;
        }
        .card-body {
          padding: 1.5rem;
        }
        .card-footer {
          background-color: #f8f9fa;
          padding: 1rem;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 0.5rem 1rem;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        .btn:hover {
          background-color: #2980b9;
        }
        footer {
          background-color: #2c3e50;
          color: white;
          text-align: center;
          padding: 1rem;
          margin-top: 2rem;
        }
        .status {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #e3f2fd;
          border-radius: 8px;
        }
        .status h2 {
          margin-top: 0;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #ddd;
        }
        .status-online {
          color: #2ecc71;
        }
        .status-offline {
          color: #e74c3c;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>TerraFusionPro</h1>
        <p>Real Estate Appraisal Platform</p>
      </header>
      
      <nav>
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="#properties">Properties</a></li>
          <li><a href="#reports">Reports</a></li>
          <li><a href="#analytics">Analytics</a></li>
          <li><a href="#account">Account</a></li>
        </ul>
      </nav>
      
      <div class="container">
        <h2>Welcome to TerraFusionPro</h2>
        <p>
          TerraFusionPro is a comprehensive real estate appraisal platform designed to streamline
          the appraisal process, improve accuracy, and provide deep insights into property valuation.
        </p>
        
        <div class="dashboard">
          <div class="card">
            <div class="card-header">Properties</div>
            <div class="card-body">
              <p>Manage your property portfolio, add new properties, and track property details.</p>
            </div>
            <div class="card-footer">
              <a href="#properties" class="btn">View Properties</a>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">Appraisal Reports</div>
            <div class="card-body">
              <p>Create, edit, and submit comprehensive appraisal reports for your properties.</p>
            </div>
            <div class="card-footer">
              <a href="#reports" class="btn">View Reports</a>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">Market Analytics</div>
            <div class="card-body">
              <p>Explore market trends, comparable sales, and valuation insights for your area.</p>
            </div>
            <div class="card-footer">
              <a href="#analytics" class="btn">View Analytics</a>
            </div>
          </div>
        </div>
        
        <div class="status">
          <h2>System Status</h2>
          <div class="status-item">
            <span>API Gateway</span>
            <span class="status-online">✓ Online</span>
          </div>
          <div class="status-item">
            <span>Property Service</span>
            <span class="status-online">✓ Online</span>
          </div>
          <div class="status-item">
            <span>User Service</span>
            <span class="status-online">✓ Online</span>
          </div>
          <div class="status-item">
            <span>Form Service</span>
            <span class="status-online">✓ Online</span>
          </div>
          <div class="status-item">
            <span>Analysis Service</span>
            <span class="status-online">✓ Online</span>
          </div>
          <div class="status-item">
            <span>Report Service</span>
            <span class="status-online">✓ Online</span>
          </div>
        </div>
      </div>
      
      <footer>
        <p>&copy; 2025 TerraFusionPro. All rights reserved.</p>
      </footer>
      
      <script>
        // Simple client-side JavaScript to check service status
        async function checkServiceStatus() {
          try {
            const response = await fetch('/api/health');
            if (response.ok) {
              console.log('API Gateway is online');
            } else {
              updateStatusDisplay('API Gateway', false);
            }
          } catch (error) {
            console.error('Error checking service status:', error);
            updateStatusDisplay('API Gateway', false);
          }
        }
        
        function updateStatusDisplay(serviceName, isOnline) {
          const statusItems = document.querySelectorAll('.status-item');
          statusItems.forEach(item => {
            if (item.textContent.includes(serviceName)) {
              const statusSpan = item.querySelector('span:last-child');
              if (isOnline) {
                statusSpan.className = 'status-online';
                statusSpan.textContent = '✓ Online';
              } else {
                statusSpan.className = 'status-offline';
                statusSpan.textContent = '✗ Offline';
              }
            }
          });
        }
        
        // Check service status when page loads
        document.addEventListener('DOMContentLoaded', () => {
          checkServiceStatus();
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Login page (not implemented)
app.get('/login', (req, res) => {
  res.send(`
    <h1>Login to TerraFusionPro</h1>
    <p>This login page is not yet implemented.</p>
    <a href="/">Back to Dashboard</a>
  `);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log('Absolutely basic web client running on port ' + PORT);
});

export default app;