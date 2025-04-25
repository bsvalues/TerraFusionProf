/**
 * TerraFusionPro Report Service
 * 
 * This service handles report generation, PDF creation, and report
 * template management for appraisal reports.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../../packages/shared/storage.js';
import { 
  appraisalReports, 
  properties, 
  comparables, 
  users,
  formSubmissions
} from '../../packages/shared/schema/index.js';
import { eq, and, desc, sql, like, gte, lte } from 'drizzle-orm';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.REPORT_SERVICE_PORT || 5004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

// Authentication middleware - we assume the API Gateway already validated the token
// and set the user ID and role in the request headers
const authenticateRequest = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  
  if (!userId || !userRole) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = {
    id: Number(userId),
    role: userRole
  };
  
  next();
};

// Apply global middleware
app.use(logRequest);
app.use(authenticateRequest);

// Health check endpoint (doesn't require authentication)
app.get('/health', (req, res, next) => {
  res.json({
    status: 'healthy',
    service: 'report-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all appraisal reports
app.get('/reports', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'updatedAt', 
      order = 'desc',
      status,
      appraiser,
      reviewer,
      propertyId,
      clientName,
      startDate,
      endDate,
      search
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query conditions
    let conditions = [];
    
    if (status) {
      conditions.push(eq(appraisalReports.status, status));
    }
    
    if (appraiser) {
      conditions.push(eq(appraisalReports.appraiser, Number(appraiser)));
    }
    
    if (reviewer) {
      conditions.push(eq(appraisalReports.reviewer, Number(reviewer)));
    }
    
    if (propertyId) {
      conditions.push(eq(appraisalReports.propertyId, Number(propertyId)));
    }
    
    if (clientName) {
      conditions.push(like(appraisalReports.clientName, `%${clientName}%`));
    }
    
    if (startDate) {
      conditions.push(gte(appraisalReports.effectiveDate, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(appraisalReports.effectiveDate, new Date(endDate)));
    }
    
    if (search) {
      conditions.push(
        sql`(${appraisalReports.title} ILIKE ${`%${search}%`} OR 
             ${appraisalReports.reportNumber} ILIKE ${`%${search}%`} OR
             ${appraisalReports.clientName} ILIKE ${`%${search}%`})`
      );
    }
    
    // Create query with joins to get property and user data
    let query = db.select({
      report: appraisalReports,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
      propertyType: properties.propertyType,
      appraiserName: sql`${users.firstName} || ' ' || ${users.lastName}`
    })
    .from(appraisalReports)
    .leftJoin(properties, eq(appraisalReports.propertyId, properties.id))
    .leftJoin(users, eq(appraisalReports.appraiser, users.id));
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    if (order.toLowerCase() === 'desc') {
      query = query.orderBy(desc(appraisalReports[sort]));
    } else {
      query = query.orderBy(appraisalReports[sort]);
    }
    
    // Add pagination
    query = query.limit(Number(limit)).offset(offset);
    
    // Execute query
    const results = await query;
    
    // Count total records for pagination metadata
    const countQuery = db.select({ count: sql`count(*)` }).from(appraisalReports);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    
    const countResult = await countQuery;
    const total = Number(countResult[0].count);
    
    // Format results
    const formattedResults = results.map(result => ({
      id: result.report.id,
      title: result.report.title,
      reportNumber: result.report.reportNumber,
      clientName: result.report.clientName,
      status: result.report.status,
      appraisalDate: result.report.appraisalDate,
      effectiveDate: result.report.effectiveDate,
      valuation: result.report.valuation,
      property: {
        id: result.report.propertyId,
        address: result.propertyAddress,
        city: result.propertyCity,
        state: result.propertyState,
        propertyType: result.propertyType
      },
      appraiser: {
        id: result.report.appraiser,
        name: result.appraiserName
      },
      version: result.report.version,
      createdAt: result.report.createdAt,
      updatedAt: result.report.updatedAt
    }));
    
    res.json({
      data: formattedResults,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report by ID
app.get('/reports/:id', async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    
    // Get report with property, appraiser, and reviewer details
    const reportQuery = db.select({
      report: appraisalReports,
      property: properties,
      appraiser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      }
    })
    .from(appraisalReports)
    .leftJoin(properties, eq(appraisalReports.propertyId, properties.id))
    .leftJoin(users, eq(appraisalReports.appraiser, users.id))
    .where(eq(appraisalReports.id, reportId))
    .limit(1);
    
    const reportResult = await reportQuery;
    
    if (reportResult.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get reviewer details if exists
    let reviewer = null;
    if (reportResult[0].report.reviewer) {
      const reviewerQuery = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, reportResult[0].report.reviewer))
      .limit(1);
      
      if (reviewerQuery.length > 0) {
        reviewer = reviewerQuery[0];
      }
    }
    
    // Get comparables for this report
    const comparablesQuery = await db.select()
      .from(comparables)
      .where(eq(comparables.reportId, reportId))
      .orderBy(desc(comparables.similarityScore));
    
    // Get form submissions for this report
    const formSubmissionsQuery = await db.select()
      .from(formSubmissions)
      .where(eq(formSubmissions.reportId, reportId));
    
    // Combine all data
    const reportData = {
      ...reportResult[0].report,
      property: reportResult[0].property,
      appraiser: reportResult[0].appraiser,
      reviewer,
      comparables: comparablesQuery,
      formSubmissions: formSubmissionsQuery
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report details' });
  }
});

// Create new appraisal report
app.post('/reports', async (req, res) => {
  try {
    const { 
      propertyId, 
      title, 
      clientName, 
      clientEmail, 
      clientPhone, 
      appraisalDate, 
      effectiveDate,
      valuation,
      valuePerSqft,
      methodology,
      conclusions
    } = req.body;
    
    // Validate required fields
    if (!propertyId || !title || !clientName || !appraisalDate || !effectiveDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['propertyId', 'title', 'clientName', 'appraisalDate', 'effectiveDate']
      });
    }
    
    // Check if property exists
    const propertyExists = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, Number(propertyId)))
      .limit(1);
      
    if (propertyExists.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Generate report number
    const reportNumber = generateReportNumber();
    
    // Create new report
    const newReport = await db.insert(appraisalReports)
      .values({
        propertyId: Number(propertyId),
        title,
        reportNumber,
        clientName,
        clientEmail,
        clientPhone,
        appraisalDate: new Date(appraisalDate),
        effectiveDate: new Date(effectiveDate),
        status: 'draft',
        valuation,
        valuePerSqft,
        methodology,
        conclusions,
        appraiser: req.user.id,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newReport[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Generate a unique report number
function generateReportNumber() {
  const prefix = 'APR';
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Update appraisal report
app.put('/reports/:id', async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const { 
      title, 
      clientName, 
      clientEmail, 
      clientPhone, 
      appraisalDate, 
      effectiveDate,
      status,
      valuation,
      valuePerSqft,
      methodology,
      conclusions,
      reviewer
    } = req.body;
    
    // Check if report exists
    const existingReport = await db.select()
      .from(appraisalReports)
      .where(eq(appraisalReports.id, reportId))
      .limit(1);
      
    if (existingReport.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Validate status changes based on roles
    if (status && status !== existingReport[0].status) {
      const isAllowedStatusChange = validateStatusChange(
        existingReport[0].status, 
        status, 
        req.user.role
      );
      
      if (!isAllowedStatusChange) {
        return res.status(403).json({ 
          error: 'Not authorized to change report status',
          currentStatus: existingReport[0].status,
          requestedStatus: status
        });
      }
    }
    
    // Calculate version increment for certain status changes
    let versionIncrement = 0;
    if (status === 'finalized' && existingReport[0].status !== 'finalized') {
      versionIncrement = 1;
    }
    
    // Update report
    const updatedReport = await db.update(appraisalReports)
      .set({
        title,
        clientName,
        clientEmail,
        clientPhone,
        appraisalDate: appraisalDate ? new Date(appraisalDate) : undefined,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        status,
        valuation,
        valuePerSqft,
        methodology,
        conclusions,
        reviewer: reviewer || existingReport[0].reviewer,
        version: versionIncrement ? existingReport[0].version + versionIncrement : undefined,
        updatedAt: new Date()
      })
      .where(eq(appraisalReports.id, reportId))
      .returning();
    
    res.json(updatedReport[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Validate status change based on role
function validateStatusChange(currentStatus, newStatus, userRole) {
  const statusFlow = {
    'draft': ['pending_review'],
    'pending_review': ['in_review', 'draft'],
    'in_review': ['approved', 'draft', 'pending_review'],
    'approved': ['finalized', 'in_review'],
    'finalized': ['archived'],
    'archived': []
  };
  
  const rolePermissions = {
    'appraiser': {
      canChangeTo: {
        'draft': ['pending_review'],
        'pending_review': ['draft']
      }
    },
    'reviewer': {
      canChangeTo: {
        'pending_review': ['in_review', 'draft'],
        'in_review': ['approved', 'pending_review'],
        'approved': ['finalized', 'in_review']
      }
    },
    'admin': {
      canChangeTo: {
        'draft': ['pending_review', 'in_review', 'approved', 'finalized', 'archived'],
        'pending_review': ['draft', 'in_review', 'approved', 'finalized', 'archived'],
        'in_review': ['draft', 'pending_review', 'approved', 'finalized', 'archived'],
        'approved': ['draft', 'pending_review', 'in_review', 'finalized', 'archived'],
        'finalized': ['draft', 'pending_review', 'in_review', 'approved', 'archived'],
        'archived': ['draft', 'pending_review', 'in_review', 'approved', 'finalized']
      }
    }
  };
  
  // Valid flow check
  if (!statusFlow[currentStatus] || !statusFlow[currentStatus].includes(newStatus)) {
    return false;
  }
  
  // Role permission check
  if (!rolePermissions[userRole]) {
    return false;
  }
  
  if (!rolePermissions[userRole].canChangeTo[currentStatus] || 
      !rolePermissions[userRole].canChangeTo[currentStatus].includes(newStatus)) {
    return false;
  }
  
  return true;
}

// Delete report (archive instead of hard delete for finalized reports)
app.delete('/reports/:id', async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    
    // Check if report exists
    const existingReport = await db.select()
      .from(appraisalReports)
      .where(eq(appraisalReports.id, reportId))
      .limit(1);
      
    if (existingReport.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // For finalized reports, archive instead of delete
    if (existingReport[0].status === 'finalized') {
      await db.update(appraisalReports)
        .set({ 
          status: 'archived',
          updatedAt: new Date()
        })
        .where(eq(appraisalReports.id, reportId));
      
      return res.json({ 
        message: 'Finalized report has been archived instead of deleted' 
      });
    }
    
    // Delete report if not finalized
    await db.delete(appraisalReports)
      .where(eq(appraisalReports.id, reportId));
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Add a comparable to a report
app.post('/reports/:id/comparables', async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const {
      propertyId,
      externalPropertyId,
      address,
      city,
      state,
      zipCode,
      salePrice,
      saleDate,
      propertyType,
      yearBuilt,
      lotSize,
      buildingSize,
      bedrooms,
      bathrooms,
      adjustments,
      adjustedPrice,
      description,
      similarityScore
    } = req.body;
    
    // Validate required fields
    if (!address || !city || !state || !zipCode || !propertyType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['address', 'city', 'state', 'zipCode', 'propertyType']
      });
    }
    
    // Check if report exists
    const reportExists = await db.select({ id: appraisalReports.id })
      .from(appraisalReports)
      .where(eq(appraisalReports.id, reportId))
      .limit(1);
      
    if (reportExists.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Create new comparable
    const newComparable = await db.insert(comparables)
      .values({
        reportId,
        propertyId: propertyId ? Number(propertyId) : undefined,
        externalPropertyId,
        address,
        city,
        state,
        zipCode,
        salePrice,
        saleDate: saleDate ? new Date(saleDate) : undefined,
        propertyType,
        yearBuilt,
        lotSize,
        buildingSize,
        bedrooms,
        bathrooms,
        adjustments,
        adjustedPrice,
        description,
        similarityScore,
        createdAt: new Date()
      })
      .returning();
    
    res.status(201).json(newComparable[0]);
  } catch (error) {
    console.error('Error adding comparable:', error);
    res.status(500).json({ error: 'Failed to add comparable' });
  }
});

// Update a comparable
app.put('/reports/:reportId/comparables/:id', async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    const comparableId = Number(req.params.id);
    const {
      propertyId,
      externalPropertyId,
      address,
      city,
      state,
      zipCode,
      salePrice,
      saleDate,
      propertyType,
      yearBuilt,
      lotSize,
      buildingSize,
      bedrooms,
      bathrooms,
      adjustments,
      adjustedPrice,
      description,
      similarityScore
    } = req.body;
    
    // Check if report and comparable exist
    const comparableExists = await db.select({ id: comparables.id })
      .from(comparables)
      .where(
        and(
          eq(comparables.id, comparableId),
          eq(comparables.reportId, reportId)
        )
      )
      .limit(1);
      
    if (comparableExists.length === 0) {
      return res.status(404).json({ error: 'Comparable not found' });
    }
    
    // Update comparable
    const updatedComparable = await db.update(comparables)
      .set({
        propertyId: propertyId ? Number(propertyId) : undefined,
        externalPropertyId,
        address,
        city,
        state,
        zipCode,
        salePrice,
        saleDate: saleDate ? new Date(saleDate) : undefined,
        propertyType,
        yearBuilt,
        lotSize,
        buildingSize,
        bedrooms,
        bathrooms,
        adjustments,
        adjustedPrice,
        description,
        similarityScore
      })
      .where(eq(comparables.id, comparableId))
      .returning();
    
    res.json(updatedComparable[0]);
  } catch (error) {
    console.error('Error updating comparable:', error);
    res.status(500).json({ error: 'Failed to update comparable' });
  }
});

// Delete a comparable
app.delete('/reports/:reportId/comparables/:id', async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    const comparableId = Number(req.params.id);
    
    // Check if report and comparable exist
    const comparableExists = await db.select({ id: comparables.id })
      .from(comparables)
      .where(
        and(
          eq(comparables.id, comparableId),
          eq(comparables.reportId, reportId)
        )
      )
      .limit(1);
      
    if (comparableExists.length === 0) {
      return res.status(404).json({ error: 'Comparable not found' });
    }
    
    // Delete comparable
    await db.delete(comparables)
      .where(eq(comparables.id, comparableId));
    
    res.json({ message: 'Comparable deleted successfully' });
  } catch (error) {
    console.error('Error deleting comparable:', error);
    res.status(500).json({ error: 'Failed to delete comparable' });
  }
});

// Generate PDF report (placeholder implementation)
app.get('/reports/:id/pdf', async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    
    // Check if report exists
    const reportExists = await db.select({ id: appraisalReports.id, status: appraisalReports.status })
      .from(appraisalReports)
      .where(eq(appraisalReports.id, reportId))
      .limit(1);
      
    if (reportExists.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if report is in a state that allows PDF generation
    const allowedStatuses = ['approved', 'finalized', 'archived'];
    if (!allowedStatuses.includes(reportExists[0].status)) {
      return res.status(400).json({ 
        error: 'Cannot generate PDF for a report that is not approved or finalized',
        currentStatus: reportExists[0].status,
        allowedStatuses
      });
    }
    
    // In a real implementation, this would call a PDF generation library
    // For now, return a message indicating this is a placeholder
    res.json({
      message: 'PDF generation is a placeholder in this implementation',
      reportId,
      status: 'success',
      pdfUrl: `/reports/${reportId}/pdf/download` // This would be the URL to download the generated PDF
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Get report statistics
app.get('/stats', async (req, res) => {
  try {
    // Count reports by status
    const reportsByStatus = await db
      .select({
        status: appraisalReports.status,
        count: sql`count(*)`.as('count')
      })
      .from(appraisalReports)
      .groupBy(appraisalReports.status);
      
    // Count reports by appraiser
    const reportsByAppraiser = await db
      .select({
        appraiser: appraisalReports.appraiser,
        name: sql`${users.firstName} || ' ' || ${users.lastName}`,
        count: sql`count(*)`.as('count')
      })
      .from(appraisalReports)
      .leftJoin(users, eq(appraisalReports.appraiser, users.id))
      .groupBy(appraisalReports.appraiser, sql`${users.firstName} || ' ' || ${users.lastName}`)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
      
    // Get monthly report counts for the last 12 months
    const monthlyReports = await db
      .select({
        month: sql`to_char(${appraisalReports.createdAt}, 'YYYY-MM')`,
        count: sql`count(*)`.as('count')
      })
      .from(appraisalReports)
      .where(
        sql`${appraisalReports.createdAt} >= current_date - interval '1 year'`
      )
      .groupBy(sql`to_char(${appraisalReports.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${appraisalReports.createdAt}, 'YYYY-MM')`);
    
    // Get average time from draft to finalized
    const avgCompletionTime = await db
      .select({
        avgDays: sql`avg(extract(epoch from (${appraisalReports.updatedAt} - ${appraisalReports.createdAt})) / 86400)`.as('avg_days')
      })
      .from(appraisalReports)
      .where(eq(appraisalReports.status, 'finalized'));
    
    res.json({
      byStatus: reportsByStatus.map(item => ({ 
        status: item.status, 
        count: Number(item.count) 
      })),
      byAppraiser: reportsByAppraiser.map(item => ({
        id: item.appraiser,
        name: item.name,
        count: Number(item.count)
      })),
      byMonth: monthlyReports.map(item => ({
        month: item.month,
        count: Number(item.count)
      })),
      averageCompletionDays: avgCompletionTime[0].avgDays ? 
        Math.round(Number(avgCompletionTime[0].avgDays)) : 0
    });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({ error: 'Failed to fetch report statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Report Service Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Report service running on port ${PORT}`);
});

export default app;