/**
 * TerraFusionPro API Gateway
 * 
 * This is the main entry point for the API Gateway, which routes requests
 * to appropriate microservices and handles authentication, rate limiting,
 * and other cross-cutting concerns.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../shared/storage.js';
import { users } from '../shared/schema/index.js';
import { eq } from 'drizzle-orm';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.API_PORT || 5002;

// Service endpoints
const SERVICES = {
  property: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5003',
  user: process.env.USER_SERVICE_URL || 'http://localhost:5004',
  form: process.env.FORM_SERVICE_URL || 'http://localhost:5005',
  analysis: process.env.ANALYSIS_SERVICE_URL || 'http://localhost:5006',
  report: process.env.REPORT_SERVICE_URL || 'http://localhost:5007'
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusionpro-secret-key-for-development-only';
const TOKEN_EXPIRY = '24h';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Rate limiting middleware (simple implementation)
const rateLimit = (req, res, next) => {
  // In a production environment, you would use a proper rate limiting library
  // and store rate limit data in Redis or another shared cache
  next();
};

// Request logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

// Apply global middleware
app.use(logRequest);
app.use(rateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResults[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'appraiser' } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await db.insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role
      });
    
    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

// Current user endpoint
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role
  });
});

// Proxy middleware options
const proxyOptions = {
  changeOrigin: true,
  pathRewrite: {
    '^/api/property': '',
    '^/api/user': '',
    '^/api/form': '',
    '^/api/analysis': '',
    '^/api/report': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add user info from JWT to headers for downstream services
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.id);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  },
  logLevel: 'silent'
};

// Configure service proxies
app.use('/api/property', authenticateToken, createProxyMiddleware({ ...proxyOptions, target: SERVICES.property }));
app.use('/api/user', authenticateToken, createProxyMiddleware({ ...proxyOptions, target: SERVICES.user }));
app.use('/api/form', authenticateToken, createProxyMiddleware({ ...proxyOptions, target: SERVICES.form }));
app.use('/api/analysis', authenticateToken, createProxyMiddleware({ ...proxyOptions, target: SERVICES.analysis }));
app.use('/api/report', authenticateToken, createProxyMiddleware({ ...proxyOptions, target: SERVICES.report }));

// API documentation
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;