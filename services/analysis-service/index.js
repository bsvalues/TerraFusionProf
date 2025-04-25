/**
 * TerraFusionPro Analysis Service
 * 
 * This service handles property valuation analysis, comparable selection,
 * and market trend calculations.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Load route modules
const valuationRoutes = require('./routes/valuation');
const comparablesRoutes = require('./routes/comparables');
const trendsRoutes = require('./routes/trends');
const adjustmentsRoutes = require('./routes/adjustments');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/terrafusion';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/valuation', valuationRoutes);
app.use('/comparables', comparablesRoutes);
app.use('/trends', trendsRoutes);
app.use('/adjustments', adjustmentsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'analysis-service' });
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
  console.log(`Analysis Service listening on port ${PORT}`);
});

module.exports = app;
