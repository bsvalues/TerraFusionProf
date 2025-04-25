/**
 * TerraFusionPro Report Service
 * 
 * This service handles report generation, PDF creation, and report
 * template management for appraisal reports.
 */

import express from 'express';
import cors from 'cors';
import { db, schema, initializeDatabase } from '../../packages/shared/storage.js';
import { eq, desc } from 'drizzle-orm';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await initializeDatabase();
    
    res.json({
      service: 'report-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      service: 'report-service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get all reports with pagination
app.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, appraiserId, reviewerId, clientId } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let conditions = [];
    
    if (status) {
      conditions.push(eq(schema.appraisalReports.status, status));
    }
    
    if (appraiserId) {
      conditions.push(eq(schema.appraisalReports.appraiserId, appraiserId));
    }
    
    if (reviewerId) {
      conditions.push(eq(schema.appraisalReports.reviewerId, reviewerId));
    }
    
    if (clientId) {
      conditions.push(eq(schema.appraisalReports.clientId, clientId));
    }
    
    // Build query
    let query = db.select({
      id: schema.appraisalReports.id,
      uuid: schema.appraisalReports.uuid,
      propertyId: schema.appraisalReports.propertyId,
      appraiserId: schema.appraisalReports.appraiserId,
      reviewerId: schema.appraisalReports.reviewerId,
      clientId: schema.appraisalReports.clientId,
      status: schema.appraisalReports.status,
      reportDate: schema.appraisalReports.reportDate,
      effectiveDate: schema.appraisalReports.effectiveDate,
      value: schema.appraisalReports.value,
      purpose: schema.appraisalReports.purpose,
      createdAt: schema.appraisalReports.createdAt,
      updatedAt: schema.appraisalReports.updatedAt,
      
      // Join property details
      propertyAddress: schema.properties.address,
      propertyCity: schema.properties.city,
      propertyState: schema.properties.state,
      propertyZipCode: schema.properties.zipCode,
      propertyType: schema.properties.propertyType,
      
      // Join appraiser details
      appraiserFirstName: schema.users.firstName,
      appraiserLastName: schema.users.lastName
    })
    .from(schema.appraisalReports)
    .leftJoin(schema.properties, eq(schema.appraisalReports.propertyId, schema.properties.id))
    .leftJoin(schema.users, eq(schema.appraisalReports.appraiserId, schema.users.id));
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(...conditions);
    }
    
    // Add pagination and ordering
    query = query
      .orderBy(desc(schema.appraisalReports.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Execute query
    const reports = await query;
    
    // Count total reports
    const countQuery = db.select({ count: db.fn.count() })
      .from(schema.appraisalReports);
      
    // Add conditions to count query if any
    if (conditions.length > 0) {
      countQuery.where(...conditions);
    }
    
    const [{ count }] = await countQuery;
    
    res.json({
      data: reports,
      pagination: {
        total: Number(count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(count) / limit)
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
    const { id } = req.params;
    
    // Get report with joined data
    const [report] = await db.select({
      id: schema.appraisalReports.id,
      uuid: schema.appraisalReports.uuid,
      propertyId: schema.appraisalReports.propertyId,
      appraiserId: schema.appraisalReports.appraiserId,
      reviewerId: schema.appraisalReports.reviewerId,
      clientId: schema.appraisalReports.clientId,
      status: schema.appraisalReports.status,
      reportDate: schema.appraisalReports.reportDate,
      effectiveDate: schema.appraisalReports.effectiveDate,
      value: schema.appraisalReports.value,
      purpose: schema.appraisalReports.purpose,
      methodology: schema.appraisalReports.methodology,
      notes: schema.appraisalReports.notes,
      pdfUrl: schema.appraisalReports.pdfUrl,
      createdAt: schema.appraisalReports.createdAt,
      updatedAt: schema.appraisalReports.updatedAt,
      data: schema.appraisalReports.data,
      
      // Join property details
      property: {
        id: schema.properties.id,
        address: schema.properties.address,
        city: schema.properties.city,
        state: schema.properties.state,
        zipCode: schema.properties.zipCode,
        propertyType: schema.properties.propertyType,
        yearBuilt: schema.properties.yearBuilt,
        squareFeet: schema.properties.squareFeet,
        lotSize: schema.properties.lotSize,
        bedrooms: schema.properties.bedrooms,
        bathrooms: schema.properties.bathrooms,
        description: schema.properties.description,
        parcelNumber: schema.properties.parcelNumber
      }
    })
    .from(schema.appraisalReports)
    .leftJoin(schema.properties, eq(schema.appraisalReports.propertyId, schema.properties.id))
    .where(eq(schema.appraisalReports.id, id));
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get comparables for the report
    const comparables = await db.select()
      .from(schema.comparables)
      .where(eq(schema.comparables.reportId, id));
    
    // Get form submissions related to this report
    const formSubmissions = await db.select({
      id: schema.formSubmissions.id,
      formId: schema.formSubmissions.formId,
      submittedById: schema.formSubmissions.submittedById,
      submittedAt: schema.formSubmissions.submittedAt,
      data: schema.formSubmissions.data,
      
      // Join form details
      formName: schema.forms.name,
      formType: schema.forms.type
    })
    .from(schema.formSubmissions)
    .leftJoin(schema.forms, eq(schema.formSubmissions.formId, schema.forms.id))
    .where(eq(schema.formSubmissions.reportId, id));
    
    // Get users involved in the report
    const users = {};
    
    if (report.appraiserId) {
      const [appraiser] = await db.select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        role: schema.users.role,
        organization: schema.users.organization
      })
      .from(schema.users)
      .where(eq(schema.users.id, report.appraiserId));
      
      if (appraiser) {
        users.appraiser = appraiser;
      }
    }
    
    if (report.reviewerId) {
      const [reviewer] = await db.select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        role: schema.users.role,
        organization: schema.users.organization
      })
      .from(schema.users)
      .where(eq(schema.users.id, report.reviewerId));
      
      if (reviewer) {
        users.reviewer = reviewer;
      }
    }
    
    if (report.clientId) {
      const [client] = await db.select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        role: schema.users.role,
        organization: schema.users.organization
      })
      .from(schema.users)
      .where(eq(schema.users.id, report.clientId));
      
      if (client) {
        users.client = client;
      }
    }
    
    res.json({
      ...report,
      comparables,
      formSubmissions,
      users
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create new report
app.post('/reports', async (req, res) => {
  try {
    const { 
      propertyId, 
      appraiserId, 
      reviewerId, 
      clientId, 
      purpose,
      effectiveDate,
      status = 'draft'
    } = req.body;
    
    // Basic validation
    if (!propertyId || !appraiserId) {
      return res.status(400).json({ error: 'Property ID and Appraiser ID are required' });
    }
    
    // Check if property exists
    const [property] = await db.select()
      .from(schema.properties)
      .where(eq(schema.properties.id, propertyId));
      
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Check if appraiser exists
    const [appraiser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, appraiserId));
      
    if (!appraiser) {
      return res.status(404).json({ error: 'Appraiser not found' });
    }
    
    // Create report
    const [newReport] = await db.insert(schema.appraisalReports)
      .values({
        propertyId,
        appraiserId,
        reviewerId,
        clientId,
        status,
        purpose,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        reportDate: new Date(),
        data: {}
      })
      .returning();
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update report
app.put('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = req.body;
    
    // Don't allow changing propertyId
    if (reportData.propertyId) {
      delete reportData.propertyId;
    }
    
    // Update report
    const [updatedReport] = await db.update(schema.appraisalReports)
      .set({
        ...reportData,
        updatedAt: new Date()
      })
      .where(eq(schema.appraisalReports.id, id))
      .returning();
    
    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Add or update comparable for a report
app.post('/reports/:id/comparables', async (req, res) => {
  try {
    const { id } = req.params;
    const comparableData = req.body;
    
    // Check if report exists
    const [report] = await db.select()
      .from(schema.appraisalReports)
      .where(eq(schema.appraisalReports.id, id));
      
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Add reportId to comparable data
    comparableData.reportId = id;
    
    // Create comparable
    const [newComparable] = await db.insert(schema.comparables)
      .values(comparableData)
      .returning();
    
    res.status(201).json(newComparable);
  } catch (error) {
    console.error('Error adding comparable:', error);
    res.status(500).json({ error: 'Failed to add comparable' });
  }
});

// Generate PDF for report
app.post('/reports/:id/generate-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if report exists
    const [report] = await db.select()
      .from(schema.appraisalReports)
      .where(eq(schema.appraisalReports.id, id));
      
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // In a real implementation, this would use a PDF generation library
    // like PDFKit, Puppeteer, or a third-party service to generate the PDF
    
    // For now, we'll just simulate the PDF generation
    const pdfUrl = `/reports/${id}/pdf/${Date.now()}.pdf`;
    
    // Update report with PDF URL
    const [updatedReport] = await db.update(schema.appraisalReports)
      .set({
        pdfUrl,
        updatedAt: new Date()
      })
      .where(eq(schema.appraisalReports.id, id))
      .returning();
    
    res.json({
      message: 'PDF generated successfully',
      pdfUrl,
      report: updatedReport
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Report service running on port ${PORT}`);
});

export default app;