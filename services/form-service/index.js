/**
 * TerraFusionPro Form Service
 * 
 * This service handles form definition, rendering, validation,
 * and processing for property data collection.
 */

import express from 'express';
import cors from 'cors';
import { db, schema, initializeDatabase } from '../../packages/shared/storage.js';
import { eq, desc } from 'drizzle-orm';
import Ajv from 'ajv';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5005;

// JSON Schema validator
const ajv = new Ajv({ allErrors: true });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await initializeDatabase();
    
    res.json({
      service: 'form-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      service: 'form-service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get all form definitions with pagination
app.get('/forms', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isActive = true } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query
    let query = db.select({
      id: schema.forms.id,
      name: schema.forms.name,
      type: schema.forms.type,
      version: schema.forms.version,
      isActive: schema.forms.isActive,
      createdAt: schema.forms.createdAt,
      updatedAt: schema.forms.updatedAt
    })
    .from(schema.forms);
    
    // Add filters
    if (type) {
      query = query.where(eq(schema.forms.type, type));
    }
    
    if (isActive === 'true' || isActive === true) {
      query = query.where(eq(schema.forms.isActive, true));
    }
    
    // Add pagination and ordering
    query = query
      .orderBy(desc(schema.forms.updatedAt))
      .limit(limit)
      .offset(offset);
    
    // Execute query
    const forms = await query;
    
    // Count total forms
    const countQuery = db.select({ count: db.fn.count() })
      .from(schema.forms)
      .where(
        type ? eq(schema.forms.type, type) : undefined,
        isActive === 'true' || isActive === true ? eq(schema.forms.isActive, true) : undefined
      );
      
    const [{ count }] = await countQuery;
    
    res.json({
      data: forms,
      pagination: {
        total: Number(count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get form definition by ID
app.get('/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get form
    const [form] = await db.select()
      .from(schema.forms)
      .where(eq(schema.forms.id, id));
      
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create form definition
app.post('/forms', async (req, res) => {
  try {
    const { name, type, schema: formSchema, version = '1.0.0' } = req.body;
    
    // Basic validation
    if (!name || !type || !formSchema) {
      return res.status(400).json({ error: 'Missing required form fields' });
    }
    
    // Validate schema is valid JSON Schema
    try {
      ajv.compile(formSchema);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON Schema', details: error.message });
    }
    
    // Create form
    const [newForm] = await db.insert(schema.forms)
      .values({
        name,
        type,
        schema: formSchema,
        version,
        createdById: req.body.createdById
      })
      .returning();
    
    res.status(201).json(newForm);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form definition
app.put('/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, schema: formSchema, version, isActive } = req.body;
    
    // Validate schema if provided
    if (formSchema) {
      try {
        ajv.compile(formSchema);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON Schema', details: error.message });
      }
    }
    
    // Update form
    const [updatedForm] = await db.update(schema.forms)
      .set({
        ...(name && { name }),
        ...(type && { type }),
        ...(formSchema && { schema: formSchema }),
        ...(version && { version }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      })
      .where(eq(schema.forms.id, id))
      .returning();
    
    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form definition
app.delete('/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if form has submissions
    const submissions = await db.select({ count: db.fn.count() })
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.formId, id));
      
    const [{ count }] = submissions;
    
    if (Number(count) > 0) {
      // Don't delete forms with submissions, just mark inactive
      const [updatedForm] = await db.update(schema.forms)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(schema.forms.id, id))
        .returning();
      
      if (!updatedForm) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      return res.json({
        message: 'Form has existing submissions and cannot be deleted. It has been marked as inactive.',
        form: updatedForm
      });
    }
    
    // Delete form if no submissions
    const [deletedForm] = await db.delete(schema.forms)
      .where(eq(schema.forms.id, id))
      .returning();
    
    if (!deletedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Submit form data
app.post('/submissions', async (req, res) => {
  try {
    const { formId, propertyId, reportId, submittedById, data } = req.body;
    
    // Basic validation
    if (!formId || !submittedById || !data) {
      return res.status(400).json({ error: 'Missing required submission fields' });
    }
    
    // Get form to validate against schema
    const [form] = await db.select()
      .from(schema.forms)
      .where(eq(schema.forms.id, formId));
      
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Validate submission data against form schema
    const validate = ajv.compile(form.schema);
    const isValid = validate(data);
    
    if (!isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validate.errors
      });
    }
    
    // Create submission
    const [newSubmission] = await db.insert(schema.formSubmissions)
      .values({
        formId,
        propertyId,
        reportId,
        submittedById,
        data
      })
      .returning();
    
    res.status(201).json(newSubmission);
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({ error: 'Failed to process form submission' });
  }
});

// Get submissions for a form
app.get('/forms/:id/submissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if form exists
    const [form] = await db.select()
      .from(schema.forms)
      .where(eq(schema.forms.id, id));
      
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Get submissions
    const submissions = await db.select()
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.formId, id))
      .orderBy(desc(schema.formSubmissions.submittedAt))
      .limit(limit)
      .offset(offset);
    
    // Count total submissions
    const [{ count }] = await db.select({ count: db.fn.count() })
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.formId, id));
    
    res.json({
      data: submissions,
      pagination: {
        total: Number(count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({ error: 'Failed to fetch form submissions' });
  }
});

// Get submissions for a property
app.get('/properties/:id/submissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get submissions
    const submissions = await db.select()
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.propertyId, id))
      .orderBy(desc(schema.formSubmissions.submittedAt))
      .limit(limit)
      .offset(offset);
    
    // Count total submissions
    const [{ count }] = await db.select({ count: db.fn.count() })
      .from(schema.formSubmissions)
      .where(eq(schema.formSubmissions.propertyId, id));
    
    res.json({
      data: submissions,
      pagination: {
        total: Number(count),
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(Number(count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching property submissions:', error);
    res.status(500).json({ error: 'Failed to fetch property submissions' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Form service running on port ${PORT}`);
});

export default app;