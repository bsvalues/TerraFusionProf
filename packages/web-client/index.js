/**
 * TerraFusionPro Web Client
 * 
 * This is the entry point for the web client application.
 * It sets up an Express server to serve the React application.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Set up API proxies to route requests to the appropriate services
app.use('/api/auth', createProxyMiddleware({ 
  target: 'http://localhost:5004', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth'
  }
}));

app.use('/api/users', createProxyMiddleware({ 
  target: 'http://localhost:5004', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users'
  }
}));

app.use('/api/properties', createProxyMiddleware({ 
  target: 'http://localhost:5003', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/properties': '/properties'
  }
}));

app.use('/api/reports', createProxyMiddleware({ 
  target: 'http://localhost:5007', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/reports': '/reports'
  }
}));

app.use('/api/forms', createProxyMiddleware({ 
  target: 'http://localhost:5005', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/forms': '/forms'
  }
}));

app.use('/api/analysis', createProxyMiddleware({ 
  target: 'http://localhost:5006', 
  changeOrigin: true,
  pathRewrite: {
    '^/api/analysis': '/analysis'
  }
}));

// For GraphQL queries, we'll use the Apollo Gateway
app.use('/graphql', createProxyMiddleware({ 
  target: 'http://localhost:4000', 
  changeOrigin: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'web-client' });
});

// The "catchall" handler: for any request that doesn't match one above,
// send back the React app's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraFusionPro Web Client running on port ${PORT}`);
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