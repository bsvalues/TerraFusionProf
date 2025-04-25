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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f9fc;
          color: #333;
        }
        header {
          background-color: #2b4b80;
          color: white;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
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
        .dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
        .login-view {
          max-width: 400px;
          margin: 3rem auto;
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
        }
        input {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
        }
        button:hover {
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
        #loading {
          display: none;
          text-align: center;
          margin-top: 1rem;
          color: #777;
        }
        #error-message {
          color: #d9534f;
          margin-top: 1rem;
          display: none;
        }
        #dashboard-view {
          display: none;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="container">
          <div class="logo">TerraFusionPro</div>
        </div>
      </header>
      
      <div id="login-view" class="login-view">
        <h2>Login to TerraFusionPro</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit">Login</button>
          <div id="loading">Logging in...</div>
          <div id="error-message"></div>
        </form>
      </div>
      
      <div id="dashboard-view">
        <nav>
          <ul>
            <li><a href="#" class="active">Dashboard</a></li>
            <li><a href="#">Properties</a></li>
            <li><a href="#">Reports</a></li>
            <li><a href="#">Analytics</a></li>
            <li><a href="#">Settings</a></li>
            <li style="margin-left: auto;"><button id="logout-button" style="width: auto; padding: 0.5rem 1rem;">Logout</button></li>
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
                <a href="#" class="btn">View Properties</a>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">Appraisal Reports</div>
              <div class="card-body">
                <p>Create, edit, and submit comprehensive appraisal reports for your properties.</p>
              </div>
              <div class="card-footer">
                <a href="#" class="btn">View Reports</a>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">Market Analytics</div>
              <div class="card-body">
                <p>Explore market trends, comparable sales, and valuation insights for your area.</p>
              </div>
              <div class="card-footer">
                <a href="#" class="btn">View Analytics</a>
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
      </div>
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Check if user is logged in
          const token = localStorage.getItem('token');
          
          if (token) {
            showDashboard();
          }
          
          // Login form submission
          document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('error-message').style.display = 'none';
            
            // Simulate login API call
            setTimeout(() => {
              if (email === 'admin@terrafusionpro.com' && password === 'admin123') {
                // Store token and show dashboard
                localStorage.setItem('token', 'sample-jwt-token');
                showDashboard();
              } else {
                document.getElementById('error-message').textContent = 'Invalid email or password';
                document.getElementById('error-message').style.display = 'block';
              }
              document.getElementById('loading').style.display = 'none';
            }, 1000);
          });
          
          // Logout button
          document.getElementById('logout-button').addEventListener('click', function() {
            localStorage.removeItem('token');
            showLogin();
          });
        });
        
        function showDashboard() {
          document.getElementById('login-view').style.display = 'none';
          document.getElementById('dashboard-view').style.display = 'block';
        }
        
        function showLogin() {
          document.getElementById('login-view').style.display = 'block';
          document.getElementById('dashboard-view').style.display = 'none';
          document.getElementById('email').value = '';
          document.getElementById('password').value = '';
        }
        
        // Check API health
        async function checkApiHealth() {
          try {
            const response = await fetch('/api/health');
            if (response.ok) {
              updateStatusDisplay('API Gateway', true);
            } else {
              updateStatusDisplay('API Gateway', false);
            }
          } catch (error) {
            console.error('Error checking API health:', error);
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
        
        // Run health check when page loads
        document.addEventListener('DOMContentLoaded', () => {
          checkApiHealth();
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraFusionPro Web Client running on port ${PORT}`);
});

export default app;