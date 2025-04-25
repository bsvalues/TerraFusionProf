/**
 * TerraFusionPro User Service
 * 
 * This service handles user management, authentication, authorization,
 * and role-based access control.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Load route modules
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const permissionsRoutes = require('./routes/permissions');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PGUSER || 'terrafusion',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'terrafusion',
  password: process.env.PGPASSWORD || 'password',
  port: process.env.PGPORT || 5432,
});

// Redis connection for session management
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const redisClient = redis.createClient({
  url: REDIS_URI,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch(err => {
  console.error('Redis connection error:', err);
});

// Make DB and Redis available to routes
app.use((req, res, next) => {
  req.db = pool;
  req.redis = redisClient;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/roles', rolesRoutes);
app.use('/permissions', permissionsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User Service listening on port ${PORT}`);
});

process.on('exit', () => {
  pool.end();
  redisClient.quit();
});

module.exports = app;
