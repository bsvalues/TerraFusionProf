/**
 * TerraFusionPro Property Service
 * 
 * This service handles property data management, storage, and retrieval.
 * It provides APIs for CRUD operations on property records, including
 * addressing, characteristics, images, and related metadata.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Load route modules
const propertiesRoutes = require('./routes/properties');
const addressRoutes = require('./routes/addresses');
const featuresRoutes = require('./routes/features');
const imagesRoutes = require('./routes/images');

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
app.use('/properties', propertiesRoutes);
app.use('/addresses', addressRoutes);
app.use('/features', featuresRoutes);
app.use('/images', imagesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'property-service' });
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
  console.log(`Property Service listening on port ${PORT}`);
});

module.exports = app;
