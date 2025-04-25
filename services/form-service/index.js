/**
 * TerraFusionPro Form Service
 * 
 * This service handles form definition, rendering, validation,
 * and processing for property data collection.
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
const formDefinitionRoutes = require('./routes/definitions');
const formInstanceRoutes = require('./routes/instances');
const formTemplateRoutes = require('./routes/templates');
const validationRoutes = require('./routes/validation');

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
app.use('/definitions', formDefinitionRoutes);
app.use('/instances', formInstanceRoutes);
app.use('/templates', formTemplateRoutes);
app.use('/validation', validationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'form-service' });
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
  console.log(`Form Service listening on port ${PORT}`);
});

module.exports = app;
