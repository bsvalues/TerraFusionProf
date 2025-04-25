/**
 * TerraFusionPro API Gateway
 * 
 * This is the main entry point for the API Gateway, which routes requests
 * to appropriate microservices and handles authentication, rate limiting,
 * and other cross-cutting concerns.
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Service endpoints (in a real deployment these would be from env vars or service discovery)
const SERVICES = {
  PROPERTY: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5001',
  USER: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  FIELD: process.env.FIELD_APP_URL || 'http://localhost:5003',
  ANALYSIS: process.env.ANALYSIS_SERVICE_URL || 'http://localhost:5004',
  FORM: process.env.FORM_SERVICE_URL || 'http://localhost:5005',
  REPORT: process.env.REPORT_SERVICE_URL || 'http://localhost:5006'
};

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Authentication middleware
const authenticate = (req, res, next) => {
  // Skip auth for certain endpoints
  if (
    req.path === '/api/health' ||
    req.path === '/api/user/auth/login' ||
    req.path === '/api/user/auth/register' ||
    req.path.startsWith('/api/public/')
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Apply authentication to all API routes
app.use('/api', authenticate);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Route health checks for all services
app.get('/api/health/services', async (req, res) => {
  const serviceHealth = {};
  const servicePromises = [];

  // Check each service health
  for (const [serviceName, serviceUrl] of Object.entries(SERVICES)) {
    const checkPromise = fetch(`${serviceUrl}/health`)
      .then(response => response.json())
      .then(data => {
        serviceHealth[serviceName.toLowerCase()] = {
          status: 'healthy',
          details: data
        };
      })
      .catch(error => {
        serviceHealth[serviceName.toLowerCase()] = {
          status: 'unhealthy',
          error: error.message
        };
      });
      
    servicePromises.push(checkPromise);
  }

  try {
    await Promise.all(servicePromises);
    
    res.json({
      gateway: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      services: serviceHealth
    });
  } catch (error) {
    res.status(500).json({
      gateway: {
        status: 'unhealthy',
        error: error.message
      },
      services: serviceHealth
    });
  }
});

// User service proxy
app.use('/api/user', createProxyMiddleware({
  target: SERVICES.USER,
  pathRewrite: {
    '^/api/user/auth': '/auth',
    '^/api/user': '/users'
  },
  changeOrigin: true
}));

// Property service proxy
app.use('/api/properties', createProxyMiddleware({
  target: SERVICES.PROPERTY,
  pathRewrite: {
    '^/api/properties': '/properties'
  },
  changeOrigin: true
}));

// Analysis service proxy
app.use('/api/analysis', createProxyMiddleware({
  target: SERVICES.ANALYSIS,
  pathRewrite: {
    '^/api/analysis': '/analysis'
  },
  changeOrigin: true
}));

// Form service proxy
app.use('/api/forms', createProxyMiddleware({
  target: SERVICES.FORM,
  pathRewrite: {
    '^/api/forms': '/forms'
  },
  changeOrigin: true
}));

app.use('/api/submissions', createProxyMiddleware({
  target: SERVICES.FORM,
  pathRewrite: {
    '^/api/submissions': '/submissions'
  },
  changeOrigin: true
}));

// Report service proxy
app.use('/api/reports', createProxyMiddleware({
  target: SERVICES.REPORT,
  pathRewrite: {
    '^/api/reports': '/reports'
  },
  changeOrigin: true
}));

// Field app proxy - this routes to the field app for mobile users
app.use('/field', createProxyMiddleware({
  target: SERVICES.FIELD,
  pathRewrite: {
    '^/field': '/'
  },
  changeOrigin: true
}));

// Additional middleware for gateway operations

// Role-based access control middleware
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - No user' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient privileges' });
    }
    
    next();
  };
};

// Admin-only endpoint example
app.get('/api/admin/users', checkRole(['admin']), (req, res) => {
  // In a real implementation, this would proxy to the user service
  // with admin-specific operations
  res.json({ message: 'This is an admin-only endpoint' });
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    console.log(
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms ${req.user?.id || 'anon'}`
    );
  });
  
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service URLs:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`- ${name}: ${url}`);
  });
});

export default app;