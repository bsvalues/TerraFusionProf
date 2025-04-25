/**
 * TerraFusionPro Form Service
 * 
 * This service handles form definition, rendering, validation,
 * and processing for property data collection.
 */

import http from 'http';
import { URL } from 'url';
import { forms, formSubmissions } from '../../packages/shared/schema/index.js';
import storageModule from '../../packages/shared/storage.js';

// Destructure the storage module for easier access
const { db, create, find, findById, update, remove } = storageModule;

// Service configuration
const PORT = process.env.SERVICE_PORT || 5005;
const SERVICE_NAME = 'form-service';

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
    
    // Form endpoints
    if (path === '/forms' || path.startsWith('/forms/')) {
      
      // Get all forms
      if (req.method === 'GET' && path === '/forms') {
        try {
          // Parse query parameters
          const limit = parseInt(url.searchParams.get('limit')) || 100;
          const offset = parseInt(url.searchParams.get('offset')) || 0;
          const sortBy = url.searchParams.get('sortBy') || 'id';
          const sortOrder = url.searchParams.get('sortOrder') || 'asc';
          
          // Filter forms based on query parameters
          const filters = {};
          if (url.searchParams.has('type')) {
            filters.type = url.searchParams.get('type');
          }
          if (url.searchParams.has('isActive')) {
            filters.isActive = url.searchParams.get('isActive') === 'true';
          }
          
          // Find forms with filters, limit, offset, and ordering
          const formList = await find(forms, filters, {
            limit,
            offset,
            orderBy: {
              [sortBy]: sortOrder
            }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            forms: formList,
            total: formList.length, // In a real app, this would be the total count without limit
            limit,
            offset
          }));
        } catch (error) {
          console.error('Error fetching forms:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching forms' }));
        }
        return;
      }
      
      // Get form by ID
      if (req.method === 'GET' && path.match(/^\/forms\/\d+$/)) {
        const formId = parseInt(path.split('/')[2]);
        
        try {
          const form = await findById(forms, formId);
          
          if (!form) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Form not found' }));
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(form));
        } catch (error) {
          console.error('Error fetching form:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching form' }));
        }
        return;
      }
      
      // Create form (admin or appraiser)
      if (req.method === 'POST' && path === '/forms') {
        // Check if user is authenticated and has appropriate role
        if (!userId || (userRole !== 'admin' && userRole !== 'appraiser')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required fields
          const requiredFields = ['title', 'type', 'schema'];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Validate schema is valid JSON
          try {
            if (typeof data.schema === 'string') {
              JSON.parse(data.schema);
            }
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid schema JSON' }));
            return;
          }
          
          // If UI schema is provided, validate it's valid JSON
          if (data.uiSchema) {
            try {
              if (typeof data.uiSchema === 'string') {
                JSON.parse(data.uiSchema);
              }
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid UI schema JSON' }));
              return;
            }
          }
          
          // Set form data
          const formData = {
            title: data.title,
            description: data.description || null,
            type: data.type,
            schema: typeof data.schema === 'object' ? JSON.stringify(data.schema) : data.schema,
            uiSchema: data.uiSchema ? (typeof data.uiSchema === 'object' ? JSON.stringify(data.uiSchema) : data.uiSchema) : null,
            version: data.version || 1,
            isActive: data.isActive !== undefined ? data.isActive : true,
            isRequired: data.isRequired !== undefined ? data.isRequired : false,
            propertyTypes: data.propertyTypes ? (typeof data.propertyTypes === 'object' ? JSON.stringify(data.propertyTypes) : data.propertyTypes) : null,
            createdBy: userId || null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create form
          const newForm = await create(forms, formData);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newForm));
        } catch (error) {
          console.error('Error creating form:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error creating form' }));
        }
        return;
      }
      
      // Update form (admin or creator)
      if (req.method === 'PUT' && path.match(/^\/forms\/\d+$/)) {
        const formId = parseInt(path.split('/')[2]);
        
        try {
          // Check if form exists
          const existingForm = await findById(forms, formId);
          
          if (!existingForm) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Form not found' }));
            return;
          }
          
          // Check if user is authorized to update this form
          if (!userId || 
              (userRole !== 'admin' && 
               existingForm.createdBy !== parseInt(userId))) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission denied' }));
            return;
          }
          
          // If schema is provided, validate it's valid JSON
          if (data.schema) {
            try {
              if (typeof data.schema === 'string') {
                JSON.parse(data.schema);
              }
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid schema JSON' }));
              return;
            }
          }
          
          // If UI schema is provided, validate it's valid JSON
          if (data.uiSchema) {
            try {
              if (typeof data.uiSchema === 'string') {
                JSON.parse(data.uiSchema);
              }
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid UI schema JSON' }));
              return;
            }
          }
          
          // If property types is provided, validate it's valid JSON
          if (data.propertyTypes) {
            try {
              if (typeof data.propertyTypes === 'string') {
                JSON.parse(data.propertyTypes);
              }
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid property types JSON' }));
              return;
            }
          }
          
          // Prepare form data for update
          const formData = {
            ...data,
            schema: data.schema ? (typeof data.schema === 'object' ? JSON.stringify(data.schema) : data.schema) : existingForm.schema,
            uiSchema: data.uiSchema ? (typeof data.uiSchema === 'object' ? JSON.stringify(data.uiSchema) : data.uiSchema) : existingForm.uiSchema,
            propertyTypes: data.propertyTypes ? (typeof data.propertyTypes === 'object' ? JSON.stringify(data.propertyTypes) : data.propertyTypes) : existingForm.propertyTypes,
            updatedAt: new Date()
          };
          
          // Increment version if schema or uiSchema changed
          if (data.schema || data.uiSchema) {
            formData.version = existingForm.version + 1;
          }
          
          // Update form
          const updatedForm = await update(forms, formId, formData);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedForm));
        } catch (error) {
          console.error('Error updating form:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error updating form' }));
        }
        return;
      }
      
      // Delete form (admin only)
      if (req.method === 'DELETE' && path.match(/^\/forms\/\d+$/)) {
        const formId = parseInt(path.split('/')[2]);
        
        // Check if user is authenticated and has admin role
        if (!userId || userRole !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Check if form exists
          const existingForm = await findById(forms, formId);
          
          if (!existingForm) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Form not found' }));
            return;
          }
          
          // Instead of physical deletion, deactivate the form
          await update(forms, formId, { isActive: false });
          
          res.writeHead(204);
          res.end();
        } catch (error) {
          console.error('Error deleting form:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error deleting form' }));
        }
        return;
      }
    }
    
    // Form submission endpoints
    if (path.startsWith('/submissions')) {
      
      // Get all submissions for a report
      if (req.method === 'GET' && path.match(/^\/submissions\/report\/\d+$/)) {
        const reportId = parseInt(path.split('/')[3]);
        
        try {
          // Find submissions for the report
          const submissionList = await find(formSubmissions, { reportId }, {
            orderBy: { submittedAt: 'desc' }
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            submissions: submissionList
          }));
        } catch (error) {
          console.error('Error fetching submissions:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching submissions' }));
        }
        return;
      }
      
      // Get submission by ID
      if (req.method === 'GET' && path.match(/^\/submissions\/\d+$/)) {
        const submissionId = parseInt(path.split('/')[2]);
        
        try {
          const submission = await findById(formSubmissions, submissionId);
          
          if (!submission) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Submission not found' }));
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(submission));
        } catch (error) {
          console.error('Error fetching submission:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching submission' }));
        }
        return;
      }
      
      // Create or update form submission
      if (req.method === 'POST' && path === '/submissions') {
        // Check if user is authenticated
        if (!userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required fields
          const requiredFields = ['formId', 'reportId', 'data'];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Check if form exists
          const existingForm = await findById(forms, data.formId);
          
          if (!existingForm) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Form not found' }));
            return;
          }
          
          // Validate data against form schema
          const formSchema = typeof existingForm.schema === 'string' ? 
            JSON.parse(existingForm.schema) : existingForm.schema;
          
          // Validate submission data
          const validationResults = validateFormData(data.data, formSchema);
          
          // Set submission data
          const submissionData = {
            formId: data.formId,
            reportId: data.reportId,
            data: typeof data.data === 'object' ? JSON.stringify(data.data) : data.data,
            submittedBy: userId,
            submittedAt: new Date(),
            updatedAt: new Date(),
            completionStatus: calculateCompletionStatus(data.data, formSchema),
            validationStatus: validationResults.valid,
            validationErrors: validationResults.errors?.length > 0 ? 
              JSON.stringify(validationResults.errors) : null
          };
          
          // Check if a submission already exists for this form and report
          const existingSubmissions = await find(formSubmissions, { 
            formId: data.formId, 
            reportId: data.reportId 
          });
          
          let submission;
          
          if (existingSubmissions.length > 0) {
            // Update existing submission
            submission = await update(
              formSubmissions, 
              existingSubmissions[0].id, 
              submissionData
            );
          } else {
            // Create new submission
            submission = await create(formSubmissions, submissionData);
          }
          
          res.writeHead(existingSubmissions.length > 0 ? 200 : 201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(submission));
        } catch (error) {
          console.error('Error submitting form:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error submitting form' }));
        }
        return;
      }
      
      // Delete submission (admin or creator)
      if (req.method === 'DELETE' && path.match(/^\/submissions\/\d+$/)) {
        const submissionId = parseInt(path.split('/')[2]);
        
        try {
          // Check if submission exists
          const existingSubmission = await findById(formSubmissions, submissionId);
          
          if (!existingSubmission) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Submission not found' }));
            return;
          }
          
          // Check if user is authorized to delete this submission
          if (!userId || 
              (userRole !== 'admin' && 
               existingSubmission.submittedBy !== parseInt(userId))) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission denied' }));
            return;
          }
          
          // Delete submission
          await remove(formSubmissions, submissionId);
          
          res.writeHead(204);
          res.end();
        } catch (error) {
          console.error('Error deleting submission:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error deleting submission' }));
        }
        return;
      }
    }
    
    // Form validation endpoint
    if (req.method === 'POST' && path === '/validate') {
      try {
        // Validate required fields
        if (!data.formId || !data.data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Form ID and data are required' }));
          return;
        }
        
        // Check if form exists
        const existingForm = await findById(forms, data.formId);
        
        if (!existingForm) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Form not found' }));
          return;
        }
        
        // Parse form schema
        const formSchema = typeof existingForm.schema === 'string' ? 
          JSON.parse(existingForm.schema) : existingForm.schema;
        
        // Validate data against form schema
        const validationResults = validateFormData(data.data, formSchema);
        
        // Calculate completion status
        const completionStatus = calculateCompletionStatus(data.data, formSchema);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          valid: validationResults.valid,
          errors: validationResults.errors || [],
          completionStatus
        }));
      } catch (error) {
        console.error('Error validating form data:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error validating form data' }));
      }
      return;
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
 * Validate form data against a schema
 * @param {Object} data - Form data to validate
 * @param {Object} schema - JSON Schema to validate against
 * @returns {Object} - Validation results with valid flag and errors
 */
function validateFormData(data, schema) {
  // Simple validation implementation
  // In a real application, this would use a library like Ajv
  
  // Parse data if it's a string
  const formData = typeof data === 'string' ? JSON.parse(data) : data;
  
  // Initialize validation results
  const results = {
    valid: true,
    errors: []
  };
  
  // Validate required properties
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (formData[field] === undefined) {
        results.valid = false;
        results.errors.push({
          field,
          message: `Required field '${field}' is missing`
        });
      }
    }
  }
  
  // Validate property types
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      // Skip if property is not provided
      if (formData[key] === undefined) {
        continue;
      }
      
      const value = formData[key];
      
      // Type validation
      if (prop.type === 'string' && typeof value !== 'string') {
        results.valid = false;
        results.errors.push({
          field: key,
          message: `Field '${key}' should be a string`
        });
      } else if (prop.type === 'number' && typeof value !== 'number') {
        results.valid = false;
        results.errors.push({
          field: key,
          message: `Field '${key}' should be a number`
        });
      } else if (prop.type === 'boolean' && typeof value !== 'boolean') {
        results.valid = false;
        results.errors.push({
          field: key,
          message: `Field '${key}' should be a boolean`
        });
      } else if (prop.type === 'array' && !Array.isArray(value)) {
        results.valid = false;
        results.errors.push({
          field: key,
          message: `Field '${key}' should be an array`
        });
      } else if (prop.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
        results.valid = false;
        results.errors.push({
          field: key,
          message: `Field '${key}' should be an object`
        });
      }
      
      // String validations
      if (typeof value === 'string') {
        if (prop.minLength !== undefined && value.length < prop.minLength) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should be at least ${prop.minLength} characters long`
          });
        }
        
        if (prop.maxLength !== undefined && value.length > prop.maxLength) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should be at most ${prop.maxLength} characters long`
          });
        }
        
        if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should match pattern ${prop.pattern}`
          });
        }
      }
      
      // Number validations
      if (typeof value === 'number') {
        if (prop.minimum !== undefined && value < prop.minimum) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should be greater than or equal to ${prop.minimum}`
          });
        }
        
        if (prop.maximum !== undefined && value > prop.maximum) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should be less than or equal to ${prop.maximum}`
          });
        }
      }
      
      // Array validations
      if (Array.isArray(value)) {
        if (prop.minItems !== undefined && value.length < prop.minItems) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should have at least ${prop.minItems} items`
          });
        }
        
        if (prop.maxItems !== undefined && value.length > prop.maxItems) {
          results.valid = false;
          results.errors.push({
            field: key,
            message: `Field '${key}' should have at most ${prop.maxItems} items`
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Calculate completion status of form data
 * @param {Object} data - Form data
 * @param {Object} schema - JSON Schema
 * @returns {number} - Completion status as a decimal between 0 and 1
 */
function calculateCompletionStatus(data, schema) {
  // Parse data if it's a string
  const formData = typeof data === 'string' ? JSON.parse(data) : data;
  
  // Get required fields from schema
  const requiredFields = schema.required || [];
  const properties = Object.keys(schema.properties || {});
  
  // If there are no properties, return 1.0 (complete)
  if (properties.length === 0) {
    return 1.0;
  }
  
  // Count total fields and completed fields
  let totalFields = properties.length;
  let completedFields = 0;
  
  // For each property, check if it's completed
  for (const key of properties) {
    const value = formData[key];
    const isRequired = requiredFields.includes(key);
    
    // If the field is undefined or null
    if (value === undefined || value === null) {
      // If it's required, it's not complete
      if (isRequired) {
        // Do nothing, completedFields stays the same
      } else {
        // If it's not required, it's still counted as complete
        completedFields++;
      }
    } else {
      // If it's a string and not empty, it's complete
      if (typeof value === 'string' && value.trim() !== '') {
        completedFields++;
      } 
      // If it's an array and not empty, it's complete
      else if (Array.isArray(value) && value.length > 0) {
        completedFields++;
      }
      // If it's an object and has some keys, it's complete
      else if (typeof value === 'object' && Object.keys(value).length > 0) {
        completedFields++;
      }
      // If it's a boolean or number, it's complete
      else if (typeof value === 'boolean' || typeof value === 'number') {
        completedFields++;
      }
    }
  }
  
  // Calculate completion status
  const completionStatus = completedFields / totalFields;
  
  // Round to 2 decimal places and ensure it's between 0 and 1
  return Math.max(0, Math.min(1, Math.round(completionStatus * 100) / 100));
}

// Initialize database and start server
storageModule.initializeDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Form service running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down form service...');
  await storageModule.closeDatabase();
  server.close(() => {
    console.log('Form service shut down complete');
    process.exit(0);
  });
});

export default server;