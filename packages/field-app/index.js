/**
 * TerraFusionPro Field App
 * 
 * Mobile-friendly application for field data collection, property inspection,
 * and on-site appraisal activities.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path (since __dirname is not available in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API info/health endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'TerraFusionPro Field App',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API endpoints for field app-specific functionality

// Get active inspection assignments
app.get('/api/assignments', (req, res) => {
  // In a real implementation, this would query a database
  res.json({
    data: [
      {
        id: 'assignment-001',
        propertyId: 'property-123',
        address: '123 Main St, Anytown, CA 94321',
        dueDate: '2025-05-15',
        status: 'assigned',
        formTemplates: ['exterior', 'interior', 'site']
      },
      {
        id: 'assignment-002',
        propertyId: 'property-456',
        address: '456 Oak Ave, Somewhere, CA 90210',
        dueDate: '2025-05-20',
        status: 'in_progress',
        formTemplates: ['exterior', 'interior', 'site', 'environmental']
      }
    ]
  });
});

// Main app route - serves the field app SPA
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta name="theme-color" content="#2563eb">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <title>TerraFusionPro Field App</title>
      <link rel="manifest" href="/manifest.json">
      <link rel="stylesheet" href="/styles.css">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          color: #1f2937;
        }
        
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .header {
          background-color: #2563eb;
          color: white;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .main-content {
          flex: 1;
          padding: 1rem;
        }
        
        .section {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .assignment-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .assignment-item {
          border-bottom: 1px solid #e5e7eb;
          padding: 0.75rem 0;
        }
        
        .assignment-item:last-child {
          border-bottom: none;
        }
        
        .address {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        
        .assignment-meta {
          display: flex;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .assignment-meta div {
          margin-right: 1rem;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .status-assigned {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .status-in-progress {
          background-color: #fffbeb;
          color: #92400e;
        }
        
        .status-completed {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .navigation {
          display: flex;
          background-color: white;
          border-top: 1px solid #e5e7eb;
          padding: 0.5rem;
          position: sticky;
          bottom: 0;
        }
        
        .nav-item {
          flex: 1;
          text-align: center;
          padding: 0.5rem;
          color: #6b7280;
          text-decoration: none;
          font-size: 0.75rem;
        }
        
        .nav-item.active {
          color: #2563eb;
          font-weight: 500;
        }
        
        .button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          display: block;
          width: 100%;
          margin-top: 1rem;
        }
        
        .button-secondary {
          background-color: #e5e7eb;
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="app">
        <header class="header">
          <div class="header-content">
            <div class="logo">TerraFusion<span style="font-weight: 300;">Field</span></div>
            <div class="user">John D.</div>
          </div>
        </header>
        
        <main class="main-content">
          <div class="section">
            <h2 class="section-title">Your Assignments</h2>
            <ul class="assignment-list">
              <li class="assignment-item">
                <div class="address">123 Main St, Anytown, CA 94321</div>
                <div class="assignment-meta">
                  <div>Due: May 15, 2025</div>
                  <div><span class="status-badge status-assigned">Assigned</span></div>
                </div>
                <button class="button">Start Inspection</button>
              </li>
              <li class="assignment-item">
                <div class="address">456 Oak Ave, Somewhere, CA 90210</div>
                <div class="assignment-meta">
                  <div>Due: May 20, 2025</div>
                  <div><span class="status-badge status-in-progress">In Progress</span></div>
                </div>
                <button class="button">Continue Inspection</button>
              </li>
            </ul>
          </div>
          
          <div class="section">
            <h2 class="section-title">Recently Completed</h2>
            <ul class="assignment-list">
              <li class="assignment-item">
                <div class="address">789 Pine Ln, Elsewhere, CA 91234</div>
                <div class="assignment-meta">
                  <div>Completed: Apr 20, 2025</div>
                  <div><span class="status-badge status-completed">Completed</span></div>
                </div>
                <button class="button button-secondary">View Report</button>
              </li>
            </ul>
          </div>
        </main>
        
        <nav class="navigation">
          <a href="#" class="nav-item active">Assignments</a>
          <a href="#" class="nav-item">Forms</a>
          <a href="#" class="nav-item">Offline</a>
          <a href="#" class="nav-item">Account</a>
        </nav>
      </div>
      
      <script>
        // In a real implementation, this would be separated into proper JS files
        document.addEventListener('DOMContentLoaded', function() {
          console.log('TerraFusionPro Field App initialized');
          
          // Basic service worker registration for offline capabilities
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
              .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
              })
              .catch(error => {
                console.error('Service Worker registration failed:', error);
              });
          }
          
          // Handle buttons
          document.querySelectorAll('.button').forEach(button => {
            button.addEventListener('click', function() {
              alert('This functionality would be implemented in a real application');
            });
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Create public directory for static files
const publicDir = path.join(__dirname, 'public');
if (!require('fs').existsSync(publicDir)) {
  require('fs').mkdirSync(publicDir, { recursive: true });
}

// Create a basic manifest.json for PWA support
const manifestPath = path.join(publicDir, 'manifest.json');
if (!require('fs').existsSync(manifestPath)) {
  const manifest = {
    name: 'TerraFusionPro Field App',
    short_name: 'TerraField',
    description: 'Mobile app for property inspection and data collection',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
  
  require('fs').writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

// Create a basic service worker for offline support
const serviceWorkerPath = path.join(publicDir, 'service-worker.js');
if (!require('fs').existsSync(serviceWorkerPath)) {
  const serviceWorker = `
    // TerraFusionPro Field App Service Worker
    const CACHE_NAME = 'terrafusion-field-cache-v1';
    const urlsToCache = [
      '/',
      '/styles.css',
      '/manifest.json'
    ];

    // Install event - cache the app shell
    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
          })
      );
    });

    // Fetch event - serve from cache if available
    self.addEventListener('fetch', event => {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            // Cache hit - return response
            if (response) {
              return response;
            }
            return fetch(event.request);
          }
        )
      );
    });

    // Activate event - clean up old caches
    self.addEventListener('activate', event => {
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    });
  `;
  
  require('fs').writeFileSync(
    serviceWorkerPath,
    serviceWorker,
    'utf8'
  );
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Field app running on port ${PORT}`);
});

export default app;