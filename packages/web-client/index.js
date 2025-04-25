/**
 * TerraFusionPro Web Client
 * 
 * This is the main entry point for the web client application,
 * built with Express to serve the React app for property management, analysis, and reporting.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path (since __dirname is not available in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create a simple API endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'TerraFusionPro Web Client',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Serve static files (once we have a build)
// app.use(express.static(path.join(__dirname, 'build')));

// For now, just serve a simple HTML page since we don't have a React build yet
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TerraFusionPro</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f9fafb;
          color: #111827;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
          text-align: center;
        }
        .logo {
          margin-bottom: 2rem;
        }
        h1 {
          font-size: 2.25rem;
          margin-bottom: 1rem;
          color: #2563eb;
        }
        p {
          font-size: 1.125rem;
          max-width: 600px;
          margin-bottom: 2rem;
        }
        .card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 2rem;
          width: 100%;
          max-width: 800px;
        }
        .status {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background-color: #10b981;
          color: white;
          font-weight: 600;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <svg width="240" height="60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M45 15L30 5L15 15V35L30 45L45 35V15Z" fill="#2563EB"/>
            <path d="M30 5L15 15V35L30 45V25L45 15V35L30 45L45 35V15L30 5Z" fill="#1E40AF"/>
            <path d="M30 5V25L15 15L30 5Z" fill="#60A5FA"/>
            <path d="M30 25L30 45L15 35V15L30 25Z" fill="#3B82F6"/>
          </g>
        </svg>
      </div>
      <div class="card">
        <h1>TerraFusionPro Web Client</h1>
        <p>
          Welcome to the TerraFusionPro platform - a next-generation real estate appraisal system.
          This is the web client server currently running in development mode.
        </p>
        <div class="status">Server Running</div>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web client server running on port ${PORT}`);
});

export default app;
