/**
 * Simplified TerraFusionPro Web Client
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure server
const PORT = process.env.WEB_CLIENT_PORT || 5000;

// Basic HTML template
const htmlTemplate = '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>TerraFusionPro</title>' +
'  <style>' +
'    body { font-family: sans-serif; margin: 0; padding: 20px; }' +
'    header { background: #2c3e50; color: white; padding: 1rem; }' +
'    .container { max-width: 1200px; margin: 0 auto; }' +
'  </style>' +
'</head>' +
'<body>' +
'  <header>' +
'    <div class="container">' +
'      <h1>TerraFusionPro Dashboard</h1>' +
'    </div>' +
'  </header>' +
'  <div class="container">' +
'    <div style="margin-top: 2rem;">' +
'      <h2>Welcome to TerraFusionPro</h2>' +
'      <p>The next-generation real estate appraisal platform.</p>' +
'      <div id="status">Loading...</div>' +
'    </div>' +
'  </div>' +
'  <script>' +
'    document.addEventListener("DOMContentLoaded", () => {' +
'      const statusEl = document.getElementById("status");' +
'      statusEl.textContent = "Application loaded successfully!";' +
'    });' +
'  </script>' +
'</body>' +
'</html>';

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(req.method + ' ' + req.url);
  
  // Handle health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'web-client',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Default: serve the HTML template for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlTemplate);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('Simplified web client running on port ' + PORT);
});

export default server;