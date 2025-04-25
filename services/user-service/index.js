/**
 * TerraFusionPro User Service
 * 
 * This service handles user management, authentication, authorization,
 * and role-based access control.
 */

import http from 'http';
import { URL } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users } from '../../packages/shared/schema/index.js';
import storageModule from '../../packages/shared/storage.js';

// Destructure the storage module for easier access
const { db, create, find, findById, update, remove } = storageModule;

// Service configuration
const PORT = process.env.SERVICE_PORT || 5000;
const SERVICE_NAME = 'user-service';
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusionpro-default-secret';
const JWT_EXPIRES_IN = '24h';

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
  const authUserId = req.headers['x-user-id'];
  const authUserRole = req.headers['x-user-role'];
  const authUserEmail = req.headers['x-user-email'];
  
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
    
    // Authentication endpoints
    if (path.startsWith('/auth')) {
      // User registration
      if (req.method === 'POST' && path === '/auth/register') {
        try {
          // Validate required fields
          const requiredFields = ['email', 'password', 'firstName', 'lastName'];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Check if user with this email already exists
          const existingUser = await find(users, { email: data.email });
          if (existingUser.length > 0) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User with this email already exists' }));
            return;
          }
          
          // Hash password
          const hashedPassword = await bcrypt.hash(data.password, 10);
          
          // Set user data
          const userData = {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role || 'appraiser', // Default role is appraiser
            company: data.company || null,
            phoneNumber: data.phoneNumber || null,
            licenseNumber: data.licenseNumber || null,
            licenseState: data.licenseState || null,
            profileImageUrl: data.profileImageUrl || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create user
          const newUser = await create(users, userData);
          
          // Remove password from response
          delete newUser.password;
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newUser));
        } catch (error) {
          console.error('Error registering user:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error registering user' }));
        }
        return;
      }
      
      // User login
      if (req.method === 'POST' && path === '/auth/login') {
        try {
          // Validate required fields
          if (!data.email || !data.password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email and password are required' }));
            return;
          }
          
          // Find user by email
          const foundUsers = await find(users, { email: data.email });
          if (foundUsers.length === 0) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid email or password' }));
            return;
          }
          
          const user = foundUsers[0];
          
          // Check if user is active
          if (!user.isActive) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Account is inactive' }));
            return;
          }
          
          // Verify password
          const isPasswordValid = await bcrypt.compare(data.password, user.password);
          if (!isPasswordValid) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid email or password' }));
            return;
          }
          
          // Generate JWT token
          const token = jwt.sign(
            { 
              id: user.id, 
              email: user.email, 
              role: user.role,
              firstName: user.firstName,
              lastName: user.lastName
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          // Remove password from response
          delete user.password;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            user,
            token,
            expiresIn: JWT_EXPIRES_IN
          }));
        } catch (error) {
          console.error('Error during login:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error during login' }));
        }
        return;
      }
      
      // Verify token
      if (req.method === 'GET' && path === '/auth/verify') {
        try {
          // Get token from authorization header
          const authHeader = req.headers['authorization'];
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No token provided' }));
            return;
          }
          
          // Verify token
          const decoded = jwt.verify(token, JWT_SECRET);
          
          // Find user by ID
          const user = await findById(users, decoded.id);
          
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          
          // Check if user is active
          if (!user.isActive) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Account is inactive' }));
            return;
          }
          
          // Remove password from response
          delete user.password;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            user,
            valid: true
          }));
        } catch (error) {
          if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
              valid: false
            }));
            return;
          }
          
          console.error('Error verifying token:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error verifying token' }));
        }
        return;
      }
    }
    
    // User endpoints
    if (path.startsWith('/users')) {
      // Get all users
      if (req.method === 'GET' && path === '/users') {
        // Check if user is authenticated and has appropriate role
        if (!authUserId || (authUserRole !== 'admin' && authUserRole !== 'reviewer')) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Parse query parameters
          const limit = parseInt(url.searchParams.get('limit')) || 100;
          const offset = parseInt(url.searchParams.get('offset')) || 0;
          const sortBy = url.searchParams.get('sortBy') || 'id';
          const sortOrder = url.searchParams.get('sortOrder') || 'asc';
          
          // Filter users based on query parameters
          const filters = {};
          if (url.searchParams.has('role')) {
            filters.role = url.searchParams.get('role');
          }
          if (url.searchParams.has('isActive')) {
            filters.isActive = url.searchParams.get('isActive') === 'true';
          }
          
          // Find users with filters, limit, offset, and ordering
          const userList = await find(users, filters, {
            limit,
            offset,
            orderBy: {
              [sortBy]: sortOrder
            }
          });
          
          // Remove passwords from response
          const sanitizedUsers = userList.map(user => {
            const { password, ...sanitizedUser } = user;
            return sanitizedUser;
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            users: sanitizedUsers,
            total: sanitizedUsers.length, // In a real app, this would be the total count without limit
            limit,
            offset
          }));
        } catch (error) {
          console.error('Error fetching users:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching users' }));
        }
        return;
      }
      
      // Get user by ID
      if (req.method === 'GET' && path.match(/^\/users\/\d+$/)) {
        const userId = parseInt(path.split('/')[2]);
        
        // Check if user is authorized to view this user
        // Allow admin, reviewer, or the user themselves
        if (!authUserId || 
            (authUserRole !== 'admin' && 
             authUserRole !== 'reviewer' && 
             parseInt(authUserId) !== userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          const user = await findById(users, userId);
          
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          
          // Remove password from response
          delete user.password;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(user));
        } catch (error) {
          console.error('Error fetching user:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error fetching user' }));
        }
        return;
      }
      
      // Create user (admin only)
      if (req.method === 'POST' && path === '/users') {
        // Check if user is authenticated and has admin role
        if (!authUserId || authUserRole !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate required fields
          const requiredFields = ['email', 'password', 'firstName', 'lastName', 'role'];
          for (const field of requiredFields) {
            if (!data[field]) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Missing required field: ${field}` }));
              return;
            }
          }
          
          // Check if user with this email already exists
          const existingUser = await find(users, { email: data.email });
          if (existingUser.length > 0) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User with this email already exists' }));
            return;
          }
          
          // Hash password
          const hashedPassword = await bcrypt.hash(data.password, 10);
          
          // Set user data
          const userData = {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            company: data.company || null,
            phoneNumber: data.phoneNumber || null,
            licenseNumber: data.licenseNumber || null,
            licenseState: data.licenseState || null,
            profileImageUrl: data.profileImageUrl || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create user
          const newUser = await create(users, userData);
          
          // Remove password from response
          delete newUser.password;
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newUser));
        } catch (error) {
          console.error('Error creating user:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error creating user' }));
        }
        return;
      }
      
      // Update user
      if (req.method === 'PUT' && path.match(/^\/users\/\d+$/)) {
        const userId = parseInt(path.split('/')[2]);
        
        // Check if user is authorized to update this user
        // Allow admin or the user themselves
        if (!authUserId || 
            (authUserRole !== 'admin' && 
             parseInt(authUserId) !== userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Check if user exists
          const existingUser = await findById(users, userId);
          
          if (!existingUser) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          
          // Prepare user data for update
          const userData = {
            ...data,
            updatedAt: new Date()
          };
          
          // Hash password if provided
          if (data.password) {
            userData.password = await bcrypt.hash(data.password, 10);
          } else {
            delete userData.password; // Don't update password if not provided
          }
          
          // Only admin can change role or active status
          if (authUserRole !== 'admin') {
            delete userData.role;
            delete userData.isActive;
          }
          
          // Update user
          const updatedUser = await update(users, userId, userData);
          
          // Remove password from response
          delete updatedUser.password;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedUser));
        } catch (error) {
          console.error('Error updating user:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error updating user' }));
        }
        return;
      }
      
      // Delete user (admin only)
      if (req.method === 'DELETE' && path.match(/^\/users\/\d+$/)) {
        const userId = parseInt(path.split('/')[2]);
        
        // Check if user is authenticated and has admin role
        if (!authUserId || authUserRole !== 'admin') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Check if user exists
          const existingUser = await findById(users, userId);
          
          if (!existingUser) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          
          // Instead of physical deletion, deactivate the user
          await update(users, userId, { isActive: false });
          
          res.writeHead(204);
          res.end();
        } catch (error) {
          console.error('Error deleting user:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error deleting user' }));
        }
        return;
      }
      
      // Change password
      if (req.method === 'POST' && path.match(/^\/users\/\d+\/change-password$/)) {
        const userId = parseInt(path.split('/')[2]);
        
        // Check if user is authorized to change this user's password
        // Allow admin or the user themselves
        if (!authUserId || 
            (authUserRole !== 'admin' && 
             parseInt(authUserId) !== userId)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Permission denied' }));
          return;
        }
        
        try {
          // Validate request
          if (!data.newPassword) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'New password is required' }));
            return;
          }
          
          // For regular users, current password is required
          if (authUserRole !== 'admin' && !data.currentPassword) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Current password is required' }));
            return;
          }
          
          // Check if user exists
          const existingUser = await findById(users, userId);
          
          if (!existingUser) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          
          // Verify current password for regular users
          if (authUserRole !== 'admin') {
            const isPasswordValid = await bcrypt.compare(data.currentPassword, existingUser.password);
            if (!isPasswordValid) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Current password is incorrect' }));
              return;
            }
          }
          
          // Hash new password
          const hashedPassword = await bcrypt.hash(data.newPassword, 10);
          
          // Update password
          await update(users, userId, {
            password: hashedPassword,
            updatedAt: new Date()
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Password updated successfully' }));
        } catch (error) {
          console.error('Error changing password:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Error changing password' }));
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

// Initialize database and start server
storageModule.initializeDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`User service running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down user service...');
  await storageModule.closeDatabase();
  server.close(() => {
    console.log('User service shut down complete');
    process.exit(0);
  });
});

export default server;