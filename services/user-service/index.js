/**
 * TerraFusionPro User Service
 * 
 * This service handles user management, authentication, authorization,
 * and role-based access control.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../packages/shared/storage.js';
import { users } from '../../packages/shared/schema/index.js';
import { eq, or, ne, and } from 'drizzle-orm';

// Initialize Express app
const app = express();
const PORT = process.env.USER_SERVICE_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusionpro-secret-key';
const JWT_EXPIRATION = '24h';

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Authentication Endpoints
 */

// User registration
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, company, phoneNumber, licenseNumber, licenseState } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required user fields' });
    }
    
    // Check if user already exists
    const existingUser = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user record
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'appraiser',
      company,
      phoneNumber,
      licenseNumber,
      licenseState
    };
    
    const result = await db.insert(users).values(userData).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      licenseNumber: users.licenseNumber,
      createdAt: users.createdAt
    });
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// User login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const userResult = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult[0];
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to log in', details: error.message });
  }
});

// Get current user profile (requires authentication)
app.get('/auth/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find user by ID
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      phoneNumber: users.phoneNumber,
      licenseNumber: users.licenseNumber,
      licenseState: users.licenseState,
      profileImageUrl: users.profileImageUrl,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, parseInt(userId)))
    .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userResult[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
});

/**
 * User Management Endpoints
 */

// Get all users (admin only)
app.get('/users', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    
    // Check admin permissions
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    
    const { page = 1, limit = 20, role, isActive, searchQuery } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      licenseNumber: users.licenseNumber,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users);
    
    // Apply filters
    let whereConditions = [];
    
    if (role) {
      whereConditions.push(eq(users.role, role));
    }
    
    if (isActive !== undefined) {
      whereConditions.push(eq(users.isActive, isActive === 'true'));
    }
    
    if (searchQuery) {
      whereConditions.push(
        or(
          like(users.firstName, `%${searchQuery}%`),
          like(users.lastName, `%${searchQuery}%`),
          like(users.email, `%${searchQuery}%`)
        )
      );
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Execute query with pagination
    const result = await query
      .limit(parseInt(limit))
      .offset(offset)
      .orderBy(users.createdAt);
    
    // Get total count
    let countQuery = db.select({ count: db.fn.count() }).from(users);
    
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions));
    }
    
    const countResult = await countQuery;
    
    // Format response
    res.json({
      data: result,
      pagination: {
        total: countResult[0].count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.headers['x-user-id'];
    const requestingUserRole = req.headers['x-user-role'];
    
    // Only allow users to access their own profile or admins to access any profile
    if (requestingUserRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Find user by ID
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      phoneNumber: users.phoneNumber,
      licenseNumber: users.licenseNumber,
      licenseState: users.licenseState,
      profileImageUrl: users.profileImageUrl,
      isActive: users.isActive,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, parseInt(id)))
    .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userResult[0]);
  } catch (error) {
    console.error(`Error fetching user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Update user profile
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.headers['x-user-id'];
    const requestingUserRole = req.headers['x-user-role'];
    const userData = req.body;
    
    // Only allow users to update their own profile or admins to update any profile
    if (requestingUserRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Check if user exists
    const existingUser = await db.select().from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle password changes
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    // Don't allow role changes unless admin
    if (userData.role && requestingUserRole !== 'admin') {
      delete userData.role;
    }
    
    // Don't allow isActive changes unless admin
    if (userData.hasOwnProperty('isActive') && requestingUserRole !== 'admin') {
      delete userData.isActive;
    }
    
    // Update timestamp
    userData.updatedAt = new Date();
    
    // Update user record
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        company: users.company,
        phoneNumber: users.phoneNumber,
        licenseNumber: users.licenseNumber,
        licenseState: users.licenseState,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        updatedAt: users.updatedAt
      });
    
    res.json(result[0]);
  } catch (error) {
    console.error(`Error updating user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Deactivate user (admin only)
app.put('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserRole = req.headers['x-user-role'];
    
    // Check admin permissions
    if (requestingUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    
    // Check if user exists
    const existingUser = await db.select().from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user status
    const result = await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive
      });
    
    res.json(result[0]);
  } catch (error) {
    console.error(`Error deactivating user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to deactivate user', details: error.message });
  }
});

// Reactivate user (admin only)
app.put('/users/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserRole = req.headers['x-user-role'];
    
    // Check admin permissions
    if (requestingUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    
    // Check if user exists
    const existingUser = await db.select().from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user status
    const result = await db.update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive
      });
    
    res.json(result[0]);
  } catch (error) {
    console.error(`Error reactivating user with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to reactivate user', details: error.message });
  }
});

// Get user statistics (admin only)
app.get('/users/stats/summary', async (req, res) => {
  try {
    const requestingUserRole = req.headers['x-user-role'];
    
    // Check admin permissions
    if (requestingUserRole !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    
    // Get total user count
    const totalCountResult = await db.select({ count: db.fn.count() }).from(users);
    
    // Get active user count
    const activeCountResult = await db.select({ count: db.fn.count() })
      .from(users)
      .where(eq(users.isActive, true));
    
    // Get user counts by role
    const roleCountsQuery = db.select({
      role: users.role,
      count: db.fn.count()
    })
    .from(users)
    .groupBy(users.role);
    
    const roleCounts = await roleCountsQuery;
    
    // Get recent users
    const recentUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .orderBy(users.createdAt, 'desc')
    .limit(5);
    
    // Return statistics
    res.json({
      totalCount: totalCountResult[0].count,
      activeCount: activeCountResult[0].count,
      inactiveCount: totalCountResult[0].count - activeCountResult[0].count,
      countsByRole: roleCounts,
      recentUsers
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics', details: error.message });
  }
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`User service running on port ${PORT}`);
});

export default server;