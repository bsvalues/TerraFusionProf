/**
 * TerraFusionPro Web Client
 * 
 * A simple HTTP server that serves a static HTML dashboard for the TerraFusionPro platform.
 */

import http from 'http';

const PORT = process.env.PORT || 5000;

// HTML content to serve
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFusionPro</title>
  <style>
    :root {
      --primary-color: #2563eb;
      --secondary-color: #4b5563;
      --accent-color: #10b981;
      --light-gray: #f3f4f6;
      --dark-gray: #1f2937;
      --white: #ffffff;
      --border-radius: 0.375rem;
      --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--light-gray);
      color: var(--dark-gray);
      line-height: 1.6;
    }
    
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .header {
      background-color: var(--white);
      padding: 1rem 2rem;
      box-shadow: var(--box-shadow);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .logo {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-color);
      display: flex;
      align-items: center;
    }
    
    .logo-icon {
      margin-right: 0.5rem;
      color: var(--accent-color);
    }
    
    .main-navigation {
      display: flex;
      align-items: center;
    }
    
    .nav-item {
      margin-left: 1.5rem;
      font-weight: 500;
      color: var(--secondary-color);
      text-decoration: none;
      transition: color 0.2s;
      cursor: pointer;
    }
    
    .nav-item:hover {
      color: var(--primary-color);
    }
    
    .nav-item.active {
      color: var(--primary-color);
    }
    
    .user-profile {
      padding: 0.5rem 0.75rem;
      border-radius: var(--border-radius);
      background-color: var(--light-gray);
      margin-left: 1.5rem;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    
    .user-profile-icon {
      margin-right: 0.5rem;
    }
    
    .main-content {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    
    .content-header {
      margin-bottom: 1.5rem;
    }
    
    .content-title {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background-color: var(--white);
      padding: 1.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--secondary-color);
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .recent-activity {
      background-color: var(--white);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 1.5rem;
    }
    
    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--dark-gray);
    }
    
    .activity-list {
      list-style: none;
    }
    
    .activity-item {
      padding: 1rem 0;
      border-bottom: 1px solid var(--light-gray);
      display: flex;
      align-items: flex-start;
    }
    
    .activity-item:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      padding: 0.5rem;
      background-color: var(--light-gray);
      border-radius: 50%;
      margin-right: 1rem;
    }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-title {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .activity-time {
      font-size: 0.75rem;
      color: var(--secondary-color);
    }
    
    .footer {
      background-color: var(--white);
      padding: 1.5rem;
      text-align: center;
      color: var(--secondary-color);
      font-size: 0.875rem;
      border-top: 1px solid var(--light-gray);
    }
    
    @media (max-width: 768px) {
      .header {
        padding: 1rem;
      }
      
      .main-content {
        padding: 1rem;
      }
      
      .dashboard-stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">⬢</span>
          TerraFusion<span style="font-weight: 400;">Pro</span>
        </div>
        <nav class="main-navigation">
          <a class="nav-item active">Dashboard</a>
          <a class="nav-item">Properties</a>
          <a class="nav-item">Reports</a>
          <a class="nav-item">Analytics</a>
          <div class="user-profile">
            <span class="user-profile-icon">👤</span>
            <span>John Doe</span>
          </div>
        </nav>
      </div>
    </header>
    
    <main class="main-content">
      <div class="content-header">
        <h1 class="content-title">Dashboard</h1>
      </div>
      
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-label">Total Properties</div>
          <div class="stat-value">128</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Reports</div>
          <div class="stat-value">24</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Reviews</div>
          <div class="stat-value">8</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed This Month</div>
          <div class="stat-value">42</div>
        </div>
      </div>
      
      <div class="recent-activity">
        <h2 class="section-title">Recent Activity</h2>
        <ul class="activity-list">
          <li class="activity-item">
            <div class="activity-icon">📋</div>
            <div class="activity-content">
              <div class="activity-title">New report created for 123 Main St</div>
              <div class="activity-time">Today, 10:45 AM</div>
            </div>
          </li>
          <li class="activity-item">
            <div class="activity-icon">👁️</div>
            <div class="activity-content">
              <div class="activity-title">Review completed for 456 Oak Avenue</div>
              <div class="activity-time">Yesterday, 3:20 PM</div>
            </div>
          </li>
          <li class="activity-item">
            <div class="activity-icon">🏠</div>
            <div class="activity-content">
              <div class="activity-title">New property added: 789 Pine Lane</div>
              <div class="activity-time">Yesterday, 11:15 AM</div>
            </div>
          </li>
          <li class="activity-item">
            <div class="activity-icon">📱</div>
            <div class="activity-content">
              <div class="activity-title">Field inspection completed by Sarah</div>
              <div class="activity-time">April 24, 2025</div>
            </div>
          </li>
          <li class="activity-item">
            <div class="activity-icon">📈</div>
            <div class="activity-content">
              <div class="activity-title">Market analysis updated for downtown area</div>
              <div class="activity-time">April 23, 2025</div>
            </div>
          </li>
        </ul>
      </div>
    </main>
    
    <footer class="footer">
      <div>© 2025 TerraFusionPro. All rights reserved.</div>
    </footer>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('TerraFusionPro Web Client initialized');
      
      // Handle navigation
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          navItems.forEach(nav => nav.classList.remove('active'));
          this.classList.add('active');
          
          // In a real implementation, this would use a frontend framework for routing
          updateContent(this.textContent);
        });
      });
      
      function updateContent(page) {
        const contentTitle = document.querySelector('.content-title');
        if (contentTitle) {
          contentTitle.textContent = page;
        }
        
        // In a real implementation, this would actually update the content
        console.log('Navigated to ' + page);
      }
    });
  </script>
</body>
</html>
`;

// Basic JSON response for API endpoints
const apiInfoResponse = JSON.stringify({
  name: 'TerraFusionPro Web Client',
  version: '1.0.0',
  status: 'healthy',
  timestamp: new Date().toISOString()
});

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle API request
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(apiInfoResponse);
    return;
  }
  
  // Serve HTML for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Web client server running on port ${PORT}`);
});

export default server;