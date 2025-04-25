/**
 * TerraFusionPro Report Service
 * 
 * This service handles report generation, PDF creation, and report
 * template management for appraisal reports.
 */

import http from 'http';
import { URL } from 'url';
import { appraisalReports, properties, users, comparables } from '../../packages/shared/schema/index.js';
import storageModule from '../../packages/shared/storage.js';
import { runAgent } from '../../packages/agents/index.js';

// Destructure the storage module for easier access
const { db, create, find, findById, update, remove } = storageModule;

// Service configuration
const PORT = process.env.SERVICE_PORT || 5004;
const SERVICE_NAME = 'report-service';

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`${req.method} ${path}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Role, X-User-Email');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse user information from headers (set by API Gateway)
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];
  
  // Handle health check (used for liveness probe)
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: SERVICE_NAME,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    // Get request body for POST and PUT requests
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT') {
      await new Promise((resolve) => {
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', resolve);
      });
    }
    
    // Parse JSON body if content-type is application/json
    let data = {};
    if (body && req.headers['content-type'] === 'application/json') {
      try {
        data = JSON.parse(body);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        return;
      }
    }
    
    // Report endpoints
    if (path === '/reports' || path.startsWith('/reports/')) {
      
      // Get all reports
      if (req.method === 'GET' && path === '/reports') {
        try {
          // Parse query parameters
          const limit = parseInt(url.searchParams.get('limit')) || 100;
          const offset = parseInt(url.searchParams.get('offset')) || 0;
          const sortBy = url.searchParams.get('sortBy') || 'id';
          const sortOrder = url.searchParams.get('sortOrder') || 'desc'; // Newest first by default
          
          // Filter reports based on query parameters
          const filters = {};
          if (url.searchParams.has('status')) {
            filters.status = url.searchParams.get('status');
          }
          if (url.searchParams.has('appraiserId') && userRole === 'admin') {
            filters.appraiserId = parseInt(url.searchParams.get('appraiserId'));
          } else if (userRole === 'appraiser') {
            // Appraisers can only see their own reports
            filters.appraiserId = parseInt(userId);
          } else if (userRole === 'reviewer') {
            // Reviewers can see reports assigned to them or in review status
            filters.reviewerId = parseInt(userId);
          } else if (userRole === 'client') {
            // Clients can only see their own reports
            filters.clientId = parseInt(userId);
          }
          
          // Find reports with filters, limit, offset, and ordering
          const reportList = await find(appraisalReports, filters, {
            limit,
            offset,
            orderBy: {
              [sortBy]: sortOrder
            }
          });
          
          // Get property details for each report
          const reportsWithDetails = await Promise.all(reportList.map(async (report) => {
            const property = await findById(properties, report.propertyId);
            let client = null;
            let appraiser = null;
            let reviewer = null;
            
            if (report.clientId) {
              client = await findById(users, report.clientId);
              if (client) {
                delete client.password; // Remove sensitive data
              }
            }
            
            if (report.appraiserId) {
              appraiser = await findById(users, report.appraiserId);
              if (appraiser) {
                delete appraiser.password; // Remove sensitive data
              }
            }
            
            if (report.reviewerId) {
              reviewer = await findById(users, report.reviewerId);
              if (reviewer) {
                delete reviewer.password; // Remove sensitive data
              }
            }
            
            return {
              ...report,
              property,
              client,
              appraiser,
              reviewer
            };
          }));
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            reports: reportsWithDetails,
            total: reportsWithDetails.length, // In a real app, this would be the total count without limit
            limit,
            offset
          }));
        } catch (error) {
          console.error('Error fetching reports:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching reports' }));
        }
        return;
      }
      
      // Get report by ID
      if (req.method === 'GET' && path.match(/^\/reports\/\d+$/)) {
        const reportId = parseInt(path.split('/')[2]);
        
        try {
          const report = await findById(appraisalReports, reportId);
          
          if (!report) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
          }
          
          // Check authorization
          if (userRole !== 'admin' && 
              (userRole === 'appraiser' && report.appraiserId !== parseInt(userId)) &&
              (userRole === 'reviewer' && report.reviewerId !== parseInt(userId)) &&
              (userRole === 'client' && report.clientId !== parseInt(userId))) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission denied' }));
            return;
          }
          
          // Get associated data
          const property = await findById(properties, report.propertyId);
          
          let client = null;
          let appraiser = null;
          let reviewer = null;
          
          if (report.clientId) {
            client = await findById(users, report.clientId);
            if (client) {
              delete client.password; // Remove sensitive data
            }
          }
          
          if (report.appraiserId) {
            appraiser = await findById(users, report.appraiserId);
            if (appraiser) {
              delete appraiser.password; // Remove sensitive data
            }
          }
          
          if (report.reviewerId) {
            reviewer = await findById(users, report.reviewerId);
            if (reviewer) {
              delete reviewer.password; // Remove sensitive data
            }
          }
          
          // Get comparables
          const comparablesList = await find(comparables, { reportId });
          
          // Construct full report data
          const fullReport = {
            ...report,
            property,
            client,
            appraiser,
            reviewer,
            comparables: comparablesList
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(fullReport));
        } catch (error) {
          console.error('Error fetching report:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching report' }));
        }
        return;
      }
      
      // Create report
      if (req.method === 'POST' && path === '/reports') {
        // Check if user is authenticated and has appropriate role
        if (!userId || (userRole !== 'admin' && userRole !== 'appraiser')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required fields
          const requiredFields = ['propertyId', 'effectiveDate', 'purpose'];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Generate a unique report number
          const reportNumber = generateReportNumber();
          
          // Set report data
          const reportData = {
            ...data,
            reportNumber,
            appraiserId: data.appraiserId || parseInt(userId),
            status: data.status || 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create report
          const newReport = await create(appraisalReports, reportData);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newReport));
        } catch (error) {
          console.error('Error creating report:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error creating report' }));
        }
        return;
      }
      
      // Update report
      if (req.method === 'PUT' && path.match(/^\/reports\/\d+$/)) {
        const reportId = parseInt(path.split('/')[2]);
        
        try {
          // Check if report exists
          const existingReport = await findById(appraisalReports, reportId);
          
          if (!existingReport) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
          }
          
          // Check authorization
          if (userRole !== 'admin' && 
              (userRole === 'appraiser' && existingReport.appraiserId !== parseInt(userId)) &&
              (userRole === 'reviewer' && existingReport.reviewerId !== parseInt(userId))) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission denied' }));
            return;
          }
          
          // Handle status changes with validation
          if (data.status && data.status !== existingReport.status) {
            const statusChangeValid = validateStatusChange(
              existingReport.status, 
              data.status, 
              userRole
            );
            
            if (!statusChangeValid) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: `Invalid status change from '${existingReport.status}' to '${data.status}' for ${userRole} role`
              }));
              return;
            }
            
            // Update timestamps based on status change
            if (data.status === 'pending_review') {
              data.submittedAt = new Date();
            } else if (data.status === 'approved') {
              data.approvedAt = new Date();
            } else if (data.status === 'finalized') {
              data.finalizedAt = new Date();
            }
          }
          
          // Update report
          const reportData = {
            ...data,
            updatedAt: new Date()
          };
          
          const updatedReport = await update(appraisalReports, reportId, reportData);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedReport));
        } catch (error) {
          console.error('Error updating report:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error updating report' }));
        }
        return;
      }
      
      // Delete report (archive)
      if (req.method === 'DELETE' && path.match(/^\/reports\/\d+$/)) {
        const reportId = parseInt(path.split('/')[2]);
        
        // Only admin can delete (archive) reports
        if (!userId || userRole !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Check if report exists
          const existingReport = await findById(appraisalReports, reportId);
          
          if (!existingReport) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
          }
          
          // Instead of physical deletion, archive the report
          await update(appraisalReports, reportId, { 
            status: 'archived',
            updatedAt: new Date()
          });
          
          res.writeHead(204);
          res.end();
        } catch (error) {
          console.error('Error archiving report:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error archiving report' }));
        }
        return;
      }
    }
    
    // PDF generation endpoints
    if (path.startsWith('/pdf')) {
      
      // Generate PDF report
      if (req.method === 'POST' && path === '/pdf/generate') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          const reportId = data.reportId;
          
          if (!reportId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report ID is required' }));
            return;
          }
          
          // Get the report
          const report = await findById(appraisalReports, reportId);
          
          if (!report) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
          }
          
          // Check authorization
          if (userRole !== 'admin' && 
              (userRole === 'appraiser' && report.appraiserId !== parseInt(userId)) &&
              (userRole === 'reviewer' && report.reviewerId !== parseInt(userId)) &&
              (userRole === 'client' && report.clientId !== parseInt(userId))) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission denied' }));
            return;
          }
          
          // In a real implementation, we would generate a PDF here
          // For this example, we'll just return a success message with mock data
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'PDF generation would occur in a production environment',
            pdfUrl: `https://api.terrafusionpro.com/pdf/${reportId}.pdf`, // Mock URL
            generatedAt: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error generating PDF:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error generating PDF' }));
        }
        return;
      }
    }
    
    // Quality control endpoints
    if (path.startsWith('/qc')) {
      
      // Run QC check on report
      if (req.method === 'POST' && path === '/qc/check') {
        // Check if user is authenticated and has appropriate role
        if (!userId || (userRole !== 'admin' && userRole !== 'reviewer' && userRole !== 'appraiser')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          const reportId = data.reportId;
          
          if (!reportId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report ID is required' }));
            return;
          }
          
          // Get the report
          const report = await findById(appraisalReports, reportId);
          
          if (!report) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
          }
          
          // Check authorization
          if (userRole === 'appraiser' && report.appraiserId !== parseInt(userId)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission denied' }));
            return;
          }
          
          // Get associated data
          const property = await findById(properties, report.propertyId);
          const comparablesList = await find(comparables, { reportId });
          
          // Run QC reviewer agent
          const qcResults = await runAgent('qc-reviewer', {
            report: {
              ...report,
              property,
              comparables: comparablesList
            },
            properties: [property],
            comparables: comparablesList
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(qcResults));
        } catch (error) {
          console.error('Error running QC check:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error running QC check' }));
        }
        return;
      }
    }
    
    // If no endpoint matched, return 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (error) {
    console.error('Unhandled error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

/**
 * Generate a unique report number
 * @returns {string} - Unique report number
 */
function generateReportNumber() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `TFP-${year}${month}${day}-${random}`;
}

/**
 * Validate status change based on current status, new status, and user role
 * @param {string} currentStatus - Current report status
 * @param {string} newStatus - New report status
 * @param {string} userRole - User role making the change
 * @returns {boolean} - Whether the status change is valid
 */
function validateStatusChange(currentStatus, newStatus, userRole) {
  // Define valid status transitions by role
  const validTransitions = {
    admin: {
      draft: ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived'],
      pending_review: ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived'],
      in_review: ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived'],
      approved: ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived'],
      finalized: ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived'],
      archived: ['draft', 'archived']
    },
    appraiser: {
      draft: ['draft', 'pending_review'],
      pending_review: ['draft'],
      in_review: [],
      approved: ['finalized'],
      finalized: [],
      archived: []
    },
    reviewer: {
      draft: [],
      pending_review: ['in_review'],
      in_review: ['pending_review', 'approved'],
      approved: [],
      finalized: [],
      archived: []
    },
    client: {
      draft: [],
      pending_review: [],
      in_review: [],
      approved: [],
      finalized: [],
      archived: []
    }
  };
  
  // Check if the transition is valid for the user role
  const allowedTransitions = validTransitions[userRole][currentStatus];
  return allowedTransitions.includes(newStatus);
}

// Initialize database and start server
storageModule.initializeDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Report service running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down report service...');
  await storageModule.closeDatabase();
  server.close(() => {
    console.log('Report service shut down complete');
    process.exit(0);
  });
});

export default server;