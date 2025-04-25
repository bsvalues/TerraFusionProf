/**
 * TerraFusionPro Report Service
 * 
 * This service handles report generation, PDF creation, and report
 * template management for appraisal reports.
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
const reportsRoutes = require('./routes/reports');
const templatesRoutes = require('./routes/templates');
const exportRoutes = require('./routes/export');
const pdfRoutes = require('./routes/pdf');

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
app.use('/reports', reportsRoutes);
app.use('/templates', templatesRoutes);
app.use('/export', exportRoutes);
app.use('/pdf', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'report-service' });
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
  console.log(`Report Service listening on port ${PORT}`);
});

module.exports = app;
