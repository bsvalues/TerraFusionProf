/**
 * Absolutely Basic TerraFusionPro Web Client 
 */

import http from 'http';

// Configure server
const PORT = process.env.WEB_CLIENT_PORT || 5000;

// HTML as a regular string (NOT a template literal)
const html = '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <title>TerraFusionPro</title>' +
'  <style>' +
'    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }' +
'    h1 { color: #2c3e50; }' +
'  </style>' +
'</head>' +
'<body>' +
'  <h1>TerraFusionPro Dashboard</h1>' +
'  <p>Welcome to the real estate appraisal platform.</p>' +
'  <div id="content">' +
'    <p>This is a basic working version of the web client.</p>' +
'    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 5px;">' +
'      <h3>System Status</h3>' +
'      <p>API Gateway: Connected</p>' +
'      <p>Database: Active</p>' +
'      <p>Authentication: Ready</p>' +
'    </div>' +
'  </div>' +
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
  
  // Serve HTML for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('Absolutely basic web client running on port ' + PORT);
});

export default server;