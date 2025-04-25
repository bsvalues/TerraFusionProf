/**
 * TerraFusionPro Web Client
 * 
 * Enhanced version with more features while maintaining compatibility
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure server
const PORT = process.env.WEB_CLIENT_PORT || 5000;
const API_URL = process.env.API_URL || 'http://localhost:5002';

// CSS Styles
const styles = 
'* { box-sizing: border-box; margin: 0; padding: 0; }' +
'body {' +
'  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;' +
'  line-height: 1.6;' +
'  color: #333;' +
'  background-color: #f8f9fa;' +
'}' +
'.container {' +
'  max-width: 1200px;' +
'  margin: 0 auto;' +
'  padding: 0 15px;' +
'}' +
'header {' +
'  background-color: #2c3e50;' +
'  color: white;' +
'  padding: 1rem 0;' +
'  box-shadow: 0 2px 5px rgba(0,0,0,0.1);' +
'}' +
'.header-content {' +
'  display: flex;' +
'  justify-content: space-between;' +
'  align-items: center;' +
'}' +
'.logo {' +
'  font-size: 1.5rem;' +
'  font-weight: bold;' +
'  color: #ecf0f1;' +
'  text-decoration: none;' +
'}' +
'nav ul {' +
'  display: flex;' +
'  list-style: none;' +
'}' +
'nav ul li {' +
'  margin-left: 1.5rem;' +
'}' +
'nav ul li a {' +
'  color: #ecf0f1;' +
'  text-decoration: none;' +
'  transition: color 0.3s;' +
'}' +
'nav ul li a:hover {' +
'  color: #3498db;' +
'}' +
'.main-content {' +
'  padding: 2rem 0;' +
'}' +
'.dashboard-grid {' +
'  display: grid;' +
'  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));' +
'  gap: 1.5rem;' +
'  margin-top: 2rem;' +
'}' +
'.card {' +
'  background: white;' +
'  border-radius: 8px;' +
'  box-shadow: 0 2px 5px rgba(0,0,0,0.1);' +
'  padding: 1.5rem;' +
'  transition: transform 0.3s, box-shadow 0.3s;' +
'}' +
'.card:hover {' +
'  transform: translateY(-5px);' +
'  box-shadow: 0 5px 15px rgba(0,0,0,0.1);' +
'}' +
'.card h3 {' +
'  margin-bottom: 1rem;' +
'  color: #2c3e50;' +
'}' +
'.card-icon {' +
'  font-size: 2rem;' +
'  margin-bottom: 1rem;' +
'  color: #3498db;' +
'}' +
'.btn {' +
'  display: inline-block;' +
'  background-color: #3498db;' +
'  color: white;' +
'  padding: 0.5rem 1rem;' +
'  border-radius: 4px;' +
'  text-decoration: none;' +
'  transition: background-color 0.3s;' +
'  margin-top: 1rem;' +
'}' +
'.btn:hover {' +
'  background-color: #2980b9;' +
'}' +
'footer {' +
'  background-color: #2c3e50;' +
'  color: #ecf0f1;' +
'  padding: 1rem 0;' +
'  text-align: center;' +
'  margin-top: 2rem;' +
'}' +
'h1 {' +
'  color: #2c3e50;' +
'  margin-bottom: 1rem;' +
'}' +
'.login-form {' +
'  max-width: 400px;' +
'  margin: 2rem auto;' +
'  padding: 2rem;' +
'  background: white;' +
'  border-radius: 8px;' +
'  box-shadow: 0 2px 10px rgba(0,0,0,0.1);' +
'}' +
'.form-group {' +
'  margin-bottom: 1rem;' +
'}' +
'.form-group label {' +
'  display: block;' +
'  margin-bottom: 0.5rem;' +
'  color: #2c3e50;' +
'}' +
'.form-group input {' +
'  width: 100%;' +
'  padding: 0.75rem;' +
'  border: 1px solid #ddd;' +
'  border-radius: 4px;' +
'  font-size: 1rem;' +
'}' +
'.btn-block {' +
'  display: block;' +
'  width: 100%;' +
'  text-align: center;' +
'  padding: 0.75rem;' +
'  font-size: 1rem;' +
'  cursor: pointer;' +
'  border: none;' +
'}' +
'.alert {' +
'  padding: 0.75rem 1.25rem;' +
'  margin-bottom: 1rem;' +
'  border-radius: 4px;' +
'}' +
'.alert-danger {' +
'  background-color: #f8d7da;' +
'  color: #721c24;' +
'  border: 1px solid #f5c6cb;' +
'}' +
'.hidden {' +
'  display: none;' +
'}';

// HTML Template
const htmlTemplate = '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>TerraFusionPro - Real Estate Appraisal Platform</title>' +
'  <style>' + styles + '</style>' +
'</head>' +
'<body>' +
'  <header>' +
'    <div class="container header-content">' +
'      <a href="/" class="logo">TerraFusionPro</a>' +
'      <nav>' +
'        <ul>' +
'          <li><a href="/">Dashboard</a></li>' +
'          <li><a href="/properties">Properties</a></li>' +
'          <li><a href="/reports">Reports</a></li>' +
'          <li><a href="/analytics">Analytics</a></li>' +
'          <li><a href="/login" id="login-link">Login</a></li>' +
'        </ul>' +
'      </nav>' +
'    </div>' +
'  </header>' +
'' +
'  <div class="container main-content" id="app">' +
'    <!-- Content will be loaded here based on the route -->' +
'  </div>' +
'' +
'  <footer>' +
'    <div class="container">' +
'      <p>&copy; 2025 TerraFusionPro. All rights reserved.</p>' +
'    </div>' +
'  </footer>' +
'' +
'  <script>' +
'    // Simple client-side router' +
'    const app = document.getElementById("app");' +
'    const loginLink = document.getElementById("login-link");' +
'    let currentUser = null;' +
'    ' +
'    // Check for existing token in localStorage' +
'    const token = localStorage.getItem("auth_token");' +
'    if (token) {' +
'      loginLink.textContent = "Logout";' +
'      // In a real app, we would validate the token with the API' +
'      currentUser = { name: "Demo User" };' +
'    }' +
'    ' +
'    // API URL for backend communication' +
'    const API_URL = "' + API_URL + '";' +
'    ' +
'    // Dashboard Page Content' +
'    function renderDashboardPage() {' +
'      if (!currentUser) {' +
'        navigateTo("/login");' +
'        return;' +
'      }' +
'      ' +
'      return "<h1>Welcome to TerraFusionPro</h1>" +' +
'         "<p>The next-generation real estate appraisal platform.</p>" +' +
'         ' +
'         "<div class=\'dashboard-grid\'>" +' +
'           "<div class=\'card\'>" +' +
'             "<div class=\'card-icon\'>📊</div>" +' +
'             "<h3>Recent Properties</h3>" +' +
'             "<p>You have 12 properties in the system.</p>" +' +
'             "<a href=\'/properties\' class=\'btn\'>View Properties</a>" +' +
'           "</div>" +' +
'           ' +
'           "<div class=\'card\'>" +' +
'             "<div class=\'card-icon\'>📝</div>" +' +
'             "<h3>Recent Reports</h3>" +' +
'             "<p>5 reports pending review.</p>" +' +
'             "<a href=\'/reports\' class=\'btn\'>View Reports</a>" +' +
'           "</div>" +' +
'           ' +
'           "<div class=\'card\'>" +' +
'             "<div class=\'card-icon\'>🏘️</div>" +' +
'             "<h3>Market Analysis</h3>" +' +
'             "<p>Market trends updated for Q2 2025.</p>" +' +
'             "<a href=\'/analytics\' class=\'btn\'>View Analysis</a>" +' +
'           "</div>" +' +
'           ' +
'           "<div class=\'card\'>" +' +
'             "<div class=\'card-icon\'>📋</div>" +' +
'             "<h3>Form Templates</h3>" +' +
'             "<p>15 templates available.</p>" +' +
'             "<a href=\'/forms\' class=\'btn\'>Manage Forms</a>" +' +
'           "</div>" +' +
'         "</div>";' +
'    }' +
'    ' +
'    // Login Page Content' +
'    function renderLoginPage() {' +
'      if (currentUser) {' +
'        navigateTo("/");' +
'        return "";' +
'      }' +
'      ' +
'      return "<div class=\'login-form\'>" +' +
'          "<h2>Login to TerraFusionPro</h2>" +' +
'          "<div class=\'alert alert-danger hidden\' id=\'login-error\'></div>" +' +
'          "<form id=\'login-form\'>" +' +
'            "<div class=\'form-group\'>" +' +
'              "<label for=\'email\'>Email Address</label>" +' +
'              "<input type=\'email\' id=\'email\' name=\'email\' required>" +' +
'            "</div>" +' +
'            "<div class=\'form-group\'>" +' +
'              "<label for=\'password\'>Password</label>" +' +
'              "<input type=\'password\' id=\'password\' name=\'password\' required>" +' +
'            "</div>" +' +
'            "<button type=\'submit\' class=\'btn btn-block\'>Login</button>" +' +
'          "</form>" +' +
'        "</div>";' +
'    }' +
'    ' +
'    // Properties Page Content' +
'    function renderPropertiesPage() {' +
'      if (!currentUser) {' +
'        navigateTo("/login");' +
'        return "";' +
'      }' +
'      ' +
'      return "<h1>Properties</h1>" +' +
'        "<p>View and manage your property portfolio.</p>" +' +
'        ' +
'        "<div class=\'dashboard-grid\'>" +' +
'          "<div class=\'card\'>" +' +
'            "<h3>123 Main St</h3>" +' +
'            "<p>Single Family Home</p>" +' +
'            "<p>4 Beds, 3 Baths, 2,500 sqft</p>" +' +
'            "<a href=\'/properties/1\' class=\'btn\'>View Details</a>" +' +
'          "</div>" +' +
'          ' +
'          "<div class=\'card\'>" +' +
'            "<h3>456 Oak Ave</h3>" +' +
'            "<p>Condo</p>" +' +
'            "<p>2 Beds, 2 Baths, 1,200 sqft</p>" +' +
'            "<a href=\'/properties/2\' class=\'btn\'>View Details</a>" +' +
'          "</div>" +' +
'          ' +
'          "<div class=\'card\'>" +' +
'            "<h3>789 Pine Rd</h3>" +' +
'            "<p>Commercial</p>" +' +
'            "<p>Office Building, 10,000 sqft</p>" +' +
'            "<a href=\'/properties/3\' class=\'btn\'>View Details</a>" +' +
'          "</div>" +' +
'        "</div>";' +
'    }' +
'    ' +
'    // Reports Page Content' +
'    function renderReportsPage() {' +
'      if (!currentUser) {' +
'        navigateTo("/login");' +
'        return "";' +
'      }' +
'      ' +
'      return "<h1>Appraisal Reports</h1>" +' +
'        "<p>View and manage your appraisal reports.</p>" +' +
'        ' +
'        "<div class=\'dashboard-grid\'>" +' +
'          "<div class=\'card\'>" +' +
'            "<h3>Report #A12345</h3>" +' +
'            "<p>123 Main St</p>" +' +
'            "<p>Status: Draft</p>" +' +
'            "<a href=\'/reports/1\' class=\'btn\'>Edit Report</a>" +' +
'          "</div>" +' +
'          ' +
'          "<div class=\'card\'>" +' +
'            "<h3>Report #A12346</h3>" +' +
'            "<p>456 Oak Ave</p>" +' +
'            "<p>Status: Pending Review</p>" +' +
'            "<a href=\'/reports/2\' class=\'btn\'>View Report</a>" +' +
'          "</div>" +' +
'          ' +
'          "<div class=\'card\'>" +' +
'            "<h3>Report #A12347</h3>" +' +
'            "<p>789 Pine Rd</p>" +' +
'            "<p>Status: Finalized</p>" +' +
'            "<a href=\'/reports/3\' class=\'btn\'>View Report</a>" +' +
'          "</div>" +' +
'        "</div>";' +
'    }' +
'    ' +
'    // Analytics Page Content' +
'    function renderAnalyticsPage() {' +
'      if (!currentUser) {' +
'        navigateTo("/login");' +
'        return "";' +
'      }' +
'      ' +
'      return "<h1>Market Analytics</h1>" +' +
'        "<p>View real estate market trends and analysis.</p>" +' +
'        ' +
'        "<div class=\'dashboard-grid\'>" +' +
'          "<div class=\'card\'>" +' +
'            "<h3>Price Trends</h3>" +' +
'            "<p>Average price in your area: $450,000</p>" +' +
'            "<p>Year-over-year change: +5.2%</p>" +' +
'          "</div>" +' +
'          ' +
'          "<div class=\'card\'>" +' +
'            "<h3>Market Conditions</h3>" +' +
'            "<p>Current status: Seller\'s Market</p>" +' +
'            "<p>Average days on market: 12</p>" +' +
'          "</div>" +' +
'          ' +
'          "<div class=\'card\'>" +' +
'            "<h3>Comparable Properties</h3>" +' +
'            "<p>15 recent sales in target area</p>" +' +
'            "<a href=\'/comparables\' class=\'btn\'>View Comparables</a>" +' +
'          "</div>" +' +
'        "</div>";' +
'    }' +
'    ' +
'    // 404 Not Found Page' +
'    function renderNotFoundPage() {' +
'      return "<h1>Page Not Found</h1>" +' +
'        "<p>Sorry, the page you are looking for does not exist.</p>" +' +
'        "<a href=\'/\' class=\'btn\'>Return to Dashboard</a>";' +
'    }' +
'    ' +
'    // Define routes and their corresponding content functions' +
'    const routes = {' +
'      "/": renderDashboardPage,' +
'      "/login": renderLoginPage,' +
'      "/properties": renderPropertiesPage,' +
'      "/reports": renderReportsPage,' +
'      "/analytics": renderAnalyticsPage' +
'    };' +
'    ' +
'    // Handle navigation' +
'    function navigateTo(path) {' +
'      window.history.pushState({}, path, window.location.origin + path);' +
'      updateContent();' +
'    }' +
'    ' +
'    // Update content based on current path' +
'    function updateContent() {' +
'      const path = window.location.pathname;' +
'      const renderFunction = routes[path] || renderNotFoundPage;' +
'      ' +
'      document.title = "TerraFusionPro - " + (path === "/" ? "Dashboard" : path.substring(1).charAt(0).toUpperCase() + path.substring(2));' +
'      app.innerHTML = renderFunction();' +
'      ' +
'      // Attach event handlers for the login form if we\'re on the login page' +
'      if (path === "/login") {' +
'        setTimeout(() => {' +
'          const loginForm = document.getElementById("login-form");' +
'          if (loginForm) {' +
'            loginForm.addEventListener("submit", handleLogin);' +
'          }' +
'        }, 100);' +
'      }' +
'    }' +
'    ' +
'    // Handle login form submission' +
'    function handleLogin(e) {' +
'      e.preventDefault();' +
'      const email = document.getElementById("email").value;' +
'      const password = document.getElementById("password").value;' +
'      ' +
'      console.log("Login attempt with:", email);' +
'      ' +
'      // For demo purposes, accept a specific email/password' +
'      if (email === "demo@terrafusionpro.com" && password === "demo123") {' +
'        const token = "demo-jwt-token";' +
'        localStorage.setItem("auth_token", token);' +
'        currentUser = { name: "Demo User" };' +
'        loginLink.textContent = "Logout";' +
'        navigateTo("/");' +
'      } else {' +
'        const errorEl = document.getElementById("login-error");' +
'        errorEl.textContent = "Invalid email or password";' +
'        errorEl.classList.remove("hidden");' +
'      }' +
'    }' +
'    ' +
'    // Initialize on page load' +
'    window.addEventListener("DOMContentLoaded", () => {' +
'      // Handle navigation clicks' +
'      document.addEventListener("click", (e) => {' +
'        if (e.target.matches("a") && e.target.href.startsWith(window.location.origin)) {' +
'          e.preventDefault();' +
'          navigateTo(new URL(e.target.href).pathname);' +
'        }' +
'        ' +
'        // Handle logout' +
'        if (e.target.id === "login-link" && e.target.textContent === "Logout") {' +
'          e.preventDefault();' +
'          localStorage.removeItem("auth_token");' +
'          currentUser = null;' +
'          loginLink.textContent = "Login";' +
'          navigateTo("/login");' +
'        }' +
'      });' +
'      ' +
'      // Handle back/forward navigation' +
'      window.addEventListener("popstate", updateContent);' +
'      ' +
'      // Initial content update' +
'      updateContent();' +
'    });' +
'  </script>' +
'</body>' +
'</html>';

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  const path = url.pathname;
  
  console.log(req.method + ' ' + path);
  
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
  
  // Handle health check (used for liveness probe)
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'web-client',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Default: serve the HTML template for all routes (client-side routing)
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlTemplate);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('Enhanced web client running on port ' + PORT);
});

export default server;