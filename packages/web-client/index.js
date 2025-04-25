/**
 * Absolutely Basic TerraFusionPro Web Client 
 */

import http from 'http';

const PORT = process.env.WEB_CLIENT_PORT || 5000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Return HTML content
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TerraFusionPro</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            width: 80%;
            margin: 0 auto;
            padding: 20px;
          }
          header {
            background-color: #35424a;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            margin-top: 20px;
            background: white;
            padding: 20px;
            border-radius: 5px;
          }
          footer {
            background-color: #35424a;
            color: white;
            text-align: center;
            padding: 10px;
            position: fixed;
            bottom: 0;
            width: 100%;
          }
          .status {
            margin-top: 20px;
            padding: 15px;
            background-color: #ebebeb;
            border-radius: 5px;
          }
          .status-item {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
          }
          .status-online {
            color: green;
            font-weight: bold;
          }
          .status-offline {
            color: red;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>TerraFusionPro Real Estate Appraisal Platform</h1>
        </header>
        
        <div class="container">
          <div class="content">
            <h2>Welcome to TerraFusionPro</h2>
            <p>A comprehensive real estate appraisal platform leveraging microservices architecture.</p>
            
            <div class="status">
              <h3>System Status</h3>
              
              <div class="status-item">
                <span>API Gateway</span>
                <span class="status-online">Online</span>
              </div>
              
              <div class="status-item">
                <span>Property Service</span>
                <span class="status-online">Online</span>
              </div>
              
              <div class="status-item">
                <span>User Service</span>
                <span class="status-online">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        <footer>
          <p>TerraFusionPro &copy; 2025</p>
        </footer>
      </body>
      </html>
    `;
    
    res.end(html);
    return;
  }
  
  // 404 Not Found for any other route
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('Absolutely basic web client running on port ' + PORT);
});

export default server;