/**
 * TerraFusionPro Form Service
 * 
 * This service handles form definition, rendering, validation,
 * and processing for property data collection.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Ajv from 'ajv';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../../packages/shared/storage.js';
import { forms, formSubmissions } from '../../packages/shared/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.FORM_SERVICE_PORT || 5005;

// Initialize JSON Schema validator
const ajv = new Ajv({ allErrors: true });

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
    service: 'form-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all form templates
app.get('/forms', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt', 
      order = 'desc',
      formType = '',
      activeOnly = 'true'
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query conditions
    let conditions = [];
    
    if (formType) {
      conditions.push(eq(forms.formType, formType));
    }
    
    if (activeOnly === 'true') {
      conditions.push(eq(forms.isActive, true));
    }
    
    // Create base query
    let query = db.select()
      .from(forms);
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    if (order.toLowerCase() === 'desc') {
      query = query.orderBy(desc(forms[sort]));
    } else {
      query = query.orderBy(forms[sort]);
    }
    
    // Add pagination
    query = query.limit(Number(limit)).offset(offset);
    
    // Execute query
    const results = await query;
    
    // Count total records for pagination metadata
    const countQuery = db.select({ count: sql`count(*)` }).from(forms);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    
    const countResult = await countQuery;
    const total = Number(countResult[0].count);
    
    // Process results to optimize response size (large schema JSONs)
    const processedResults = results.map(form => ({
      id: form.id,
      formName: form.formName,
      formType: form.formType,
      version: form.version,
      isActive: form.isActive,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      // Only send a stripped down schema summary in the list view
      schemaFields: form.schema?.properties ? Object.keys(form.schema.properties).length : 0
    }));
    
    res.json({
      data: processedResults,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get form by ID
app.get('/forms/:id', async (req, res) => {
  try {
    const formId = Number(req.params.id);
    
    // Get form details
    const formResult = await db.select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);
      
    if (formResult.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(formResult[0]);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form details' });
  }
});

// Create new form template
app.post('/forms', async (req, res) => {
  try {
    const { formName, formType, schema, version = 1, isActive = true } = req.body;
    
    // Validate required fields
    if (!formName || !formType || !schema) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['formName', 'formType', 'schema']
      });
    }
    
    // Validate form schema is a valid JSON Schema
    try {
      ajv.compile(schema);
    } catch (schemaError) {
      return res.status(400).json({ 
        error: 'Invalid JSON Schema',
        details: schemaError.message
      });
    }
    
    // Create new form
    const newForm = await db.insert(forms)
      .values({
        formName,
        formType,
        schema,
        version,
        isActive,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newForm[0]);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form template
app.put('/forms/:id', async (req, res) => {
  try {
    const formId = Number(req.params.id);
    const { formName, formType, schema, version, isActive } = req.body;
    
    // Check if form exists
    const existingForm = await db.select({ id: forms.id, version: forms.version })
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);
      
    if (existingForm.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Validate form schema if provided
    if (schema) {
      try {
        ajv.compile(schema);
      } catch (schemaError) {
        return res.status(400).json({ 
          error: 'Invalid JSON Schema',
          details: schemaError.message
        });
      }
    }
    
    // Increment version if not explicitly provided
    const newVersion = version || existingForm[0].version + 1;
    
    // Update form
    const updatedForm = await db.update(forms)
      .set({
        formName,
        formType,
        schema,
        version: newVersion,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(forms.id, formId))
      .returning();
    
    res.json(updatedForm[0]);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form template
app.delete('/forms/:id', async (req, res) => {
  try {
    const formId = Number(req.params.id);
    
    // Check if form exists
    const existingForm = await db.select({ id: forms.id })
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);
      
    if (existingForm.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Check if form has submissions
    const submissionCount = await db.select({ count: sql`count(*)` })
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId));
    
    if (Number(submissionCount[0].count) > 0) {
      // Instead of deleting, mark as inactive
      await db.update(forms)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(forms.id, formId));
      
      return res.json({ 
        message: 'Form has existing submissions and cannot be deleted. It has been marked as inactive instead.' 
      });
    }
    
    // Delete form if no submissions exist
    await db.delete(forms)
      .where(eq(forms.id, formId));
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Submit form data
app.post('/submissions', async (req, res) => {
  try {
    const { formId, propertyId, reportId, data } = req.body;
    
    // Validate required fields
    if (!formId || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['formId', 'data']
      });
    }
    
    // Check if form exists
    const formResult = await db.select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);
      
    if (formResult.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const form = formResult[0];
    
    // Validate submission data against form schema
    const validate = ajv.compile(form.schema);
    const valid = validate(data);
    
    if (!valid) {
      return res.status(400).json({
        error: 'Invalid form data',
        details: validate.errors
      });
    }
    
    // Create form submission
    const newSubmission = await db.insert(formSubmissions)
      .values({
        formId,
        propertyId,
        reportId,
        data,
        submittedBy: req.user.id,
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newSubmission[0]);
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get form submissions
app.get('/submissions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      formId, 
      propertyId, 
      reportId, 
      submittedBy 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query conditions
    let conditions = [];
    
    if (formId) {
      conditions.push(eq(formSubmissions.formId, Number(formId)));
    }
    
    if (propertyId) {
      conditions.push(eq(formSubmissions.propertyId, Number(propertyId)));
    }
    
    if (reportId) {
      conditions.push(eq(formSubmissions.reportId, Number(reportId)));
    }
    
    if (submittedBy) {
      conditions.push(eq(formSubmissions.submittedBy, Number(submittedBy)));
    }
    
    // Create base query
    let query = db.select()
      .from(formSubmissions);
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting by submission date
    query = query.orderBy(desc(formSubmissions.submittedAt));
    
    // Add pagination
    query = query.limit(Number(limit)).offset(offset);
    
    // Execute query
    const results = await query;
    
    // Count total records for pagination metadata
    const countQuery = db.select({ count: sql`count(*)` }).from(formSubmissions);
    
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    
    const countResult = await countQuery;
    const total = Number(countResult[0].count);
    
    res.json({
      data: results,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({ error: 'Failed to fetch form submissions' });
  }
});

// Get form submission by ID
app.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    
    // Get submission details
    const submissionResult = await db.select()
      .from(formSubmissions)
      .where(eq(formSubmissions.id, submissionId))
      .limit(1);
      
    if (submissionResult.length === 0) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    // Get associated form details
    const formResult = await db.select()
      .from(forms)
      .where(eq(forms.id, submissionResult[0].formId))
      .limit(1);
    
    res.json({
      ...submissionResult[0],
      form: formResult.length > 0 ? {
        id: formResult[0].id,
        formName: formResult[0].formName,
        formType: formResult[0].formType,
        version: formResult[0].version
      } : null
    });
  } catch (error) {
    console.error('Error fetching form submission:', error);
    res.status(500).json({ error: 'Failed to fetch form submission details' });
  }
});

// Update form submission
app.put('/submissions/:id', async (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    const { data } = req.body;
    
    // Check if submission exists
    const submissionResult = await db.select({ id: formSubmissions.id, formId: formSubmissions.formId })
      .from(formSubmissions)
      .where(eq(formSubmissions.id, submissionId))
      .limit(1);
      
    if (submissionResult.length === 0) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    // Get form for validation
    const formResult = await db.select()
      .from(forms)
      .where(eq(forms.id, submissionResult[0].formId))
      .limit(1);
    
    if (formResult.length === 0) {
      return res.status(404).json({ error: 'Associated form template not found' });
    }
    
    // Validate submission data against form schema
    const validate = ajv.compile(formResult[0].schema);
    const valid = validate(data);
    
    if (!valid) {
      return res.status(400).json({
        error: 'Invalid form data',
        details: validate.errors
      });
    }
    
    // Update submission
    const updatedSubmission = await db.update(formSubmissions)
      .set({
        data,
        updatedAt: new Date()
      })
      .where(eq(formSubmissions.id, submissionId))
      .returning();
    
    res.json(updatedSubmission[0]);
  } catch (error) {
    console.error('Error updating form submission:', error);
    res.status(500).json({ error: 'Failed to update form submission' });
  }
});

// Delete form submission
app.delete('/submissions/:id', async (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    
    // Check if submission exists
    const existingSubmission = await db.select({ id: formSubmissions.id })
      .from(formSubmissions)
      .where(eq(formSubmissions.id, submissionId))
      .limit(1);
      
    if (existingSubmission.length === 0) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    // Delete submission
    await db.delete(formSubmissions)
      .where(eq(formSubmissions.id, submissionId));
    
    res.json({ message: 'Form submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting form submission:', error);
    res.status(500).json({ error: 'Failed to delete form submission' });
  }
});

// Get form template statistics
app.get('/forms/stats', async (req, res) => {
  try {
    // Count forms by type
    const formsByType = await db
      .select({
        type: forms.formType,
        count: sql`count(*)`.as('count')
      })
      .from(forms)
      .groupBy(forms.formType);
      
    // Count active vs inactive forms
    const formsByStatus = await db
      .select({
        active: forms.isActive,
        count: sql`count(*)`.as('count')
      })
      .from(forms)
      .groupBy(forms.isActive);
      
    // Get total form count
    const totalFormsResult = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(forms);
      
    // Get total submission count
    const totalSubmissionsResult = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(formSubmissions);
      
    // Get form usage statistics
    const formUsage = await db
      .select({
        formId: formSubmissions.formId,
        count: sql`count(*)`.as('count')
      })
      .from(formSubmissions)
      .groupBy(formSubmissions.formId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);
      
    // Get form names for usage statistics
    const formIds = formUsage.map(f => f.formId);
    const formNames = await db
      .select({
        id: forms.id,
        name: forms.formName
      })
      .from(forms)
      .where(sql`${forms.id} IN (${formIds.join(',')})`);
      
    // Combine form usage with names
    const formUsageWithNames = formUsage.map(usage => {
      const form = formNames.find(f => f.id === usage.formId);
      return {
        formId: usage.formId,
        formName: form ? form.name : 'Unknown Form',
        count: Number(usage.count)
      };
    });
    
    res.json({
      totalForms: Number(totalFormsResult[0].count),
      totalSubmissions: Number(totalSubmissionsResult[0].count),
      byType: formsByType.map(item => ({ ...item, count: Number(item.count) })),
      byStatus: formsByStatus.map(item => ({ 
        status: item.active ? 'active' : 'inactive',
        count: Number(item.count) 
      })),
      mostUsed: formUsageWithNames
    });
  } catch (error) {
    console.error('Error fetching form statistics:', error);
    res.status(500).json({ error: 'Failed to fetch form statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Form Service Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Form service running on port ${PORT}`);
});

export default app;