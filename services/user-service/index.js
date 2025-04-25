/**
 * TerraFusionPro User Service
 * 
 * This service handles user management, authentication, authorization,
 * and role-based access control.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import { db } from '../../packages/shared/storage.js';
import { users } from '../../packages/shared/schema/index.js';
import { eq, and, desc, sql, like } from 'drizzle-orm';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.USER_SERVICE_PORT || 5000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'terrafusionpro-secret-key';
const JWT_EXPIRES_IN = '24h';

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

// Authentication middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Role-based access control middleware
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Apply global middleware
app.use(logRequest);

// Health check endpoint (doesn't require authentication)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// User Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['email', 'password']
      });
    }
    
    // Find user by email
    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult[0];
    
    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login timestamp
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
    
    // Generate JWT token
    const token = jwt.sign({ 
      id: user.id,
      email: user.email,
      role: user.role 
    }, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// Register new user (admin-only operation)
app.post('/users', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role = 'appraiser',
      company,
      phone,
      avatar,
      active = true
    } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['email', 'password', 'firstName', 'lastName']
      });
    }
    
    // Check if user with email already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await db.insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        company,
        phone,
        avatar,
        active,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = newUser[0];
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Self-registration (limited role, needs admin approval)
app.post('/auth/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      company,
      phone
    } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['email', 'password', 'firstName', 'lastName']
      });
    }
    
    // Check if user with email already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user (inactive by default, needs admin approval)
    const newUser = await db.insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'client', // Default role for self-registered users
        company,
        phone,
        active: false, // Inactive until approved
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = newUser[0];
    
    res.status(201).json({
      ...userWithoutPassword,
      message: 'Registration successful. Your account is pending approval.'
    });
    
    // In a real implementation, this would notify admins of a pending approval
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Get all users (admin and manager roles)
app.get('/users', authenticateToken, authorizeRoles(['admin', 'reviewer']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'lastName', 
      order = 'asc',
      role,
      active,
      search
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query conditions
    let conditions = [];
    
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    if (active !== undefined) {
      conditions.push(eq(users.active, active === 'true'));
    }
    
    if (search) {
      conditions.push(
        sql`(${users.firstName} ILIKE ${`%${search}%`} OR 
             ${users.lastName} ILIKE ${`%${search}%`} OR
             ${users.email} ILIKE ${`%${search}%`} OR
             ${users.company} ILIKE ${`%${search}%`})`
      );
    }
    
    // Create query
    let query = db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      phone: users.phone,
      avatar: users.avatar,
      active: users.active,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users);
    
    // Add conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add sorting
    if (order.toLowerCase() === 'desc') {
      query = query.orderBy(desc(users[sort]));
    } else {
      query = query.orderBy(users[sort]);
    }
    
    // Add pagination
    query = query.limit(Number(limit)).offset(offset);
    
    // Execute query
    const results = await query;
    
    // Count total records for pagination metadata
    const countQuery = db.select({ count: sql`count(*)` }).from(users);
    
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
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    // Check permissions - users can view their own profile or admins can view any
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this user profile' });
    }
    
    // Get user details
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      phone: users.phone,
      avatar: users.avatar,
      active: users.active,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
      
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userResult[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user profile
app.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    // Check for permission - users can only update their own profile unless admin
    const isSelfUpdate = req.user.id === userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isSelfUpdate && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to update this user profile' });
    }
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      company,
      phone,
      avatar,
      active
    } = req.body;
    
    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create update object (only include fields that are provided)
    const updates = {};
    
    if (email) {
      // Only admins can change email
      if (!isAdmin && email !== existingUser[0].email) {
        return res.status(403).json({ error: 'Only administrators can change email addresses' });
      }
      updates.email = email.toLowerCase();
    }
    
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    
    if (role) {
      // Only admins can change roles
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can change user roles' });
      }
      updates.role = role;
    }
    
    if (company) updates.company = company;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;
    
    if (active !== undefined) {
      // Only admins can change active status
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only administrators can change account status' });
      }
      updates.active = active;
    }
    
    // Update timestamp
    updates.updatedAt = new Date();
    
    // Update user
    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = updatedUser[0];
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete('/users/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    
    // Prevent deleting self
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    await db.delete(users)
      .where(eq(users.id, userId));
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Verify authentication token
app.get('/auth/verify', authenticateToken, async (req, res) => {
  try {
    // Get current user details
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      company: users.company,
      phone: users.phone,
      avatar: users.avatar,
      active: users.active,
      lastLogin: users.lastLogin
    })
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is still active
    if (!userResult[0].active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    res.json({
      user: userResult[0],
      token: req.headers.authorization.split(' ')[1]
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Change password
app.post('/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['currentPassword', 'newPassword']
      });
    }
    
    // Get user with password
    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult[0];
    
    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!passwordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id));
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user statistics
app.get('/users/stats', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    // Count users by role
    const usersByRole = await db
      .select({
        role: users.role,
        count: sql`count(*)`.as('count')
      })
      .from(users)
      .groupBy(users.role);
      
    // Count active vs inactive users
    const usersByStatus = await db
      .select({
        active: users.active,
        count: sql`count(*)`.as('count')
      })
      .from(users)
      .groupBy(users.active);
      
    // Get total user count
    const totalUsersResult = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(users);
      
    // Get recently active users count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyActiveCount = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(users)
      .where(sql`${users.lastLogin} >= ${thirtyDaysAgo}`);
      
    // Get new users this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(users)
      .where(sql`${users.createdAt} >= ${firstDayOfMonth}`);
    
    res.json({
      totalUsers: Number(totalUsersResult[0].count),
      recentlyActive: Number(recentlyActiveCount[0].count),
      newThisMonth: Number(newUsersThisMonth[0].count),
      byRole: usersByRole.map(item => ({ ...item, count: Number(item.count) })),
      byStatus: usersByStatus.map(item => ({
        status: item.active ? 'active' : 'inactive',
        count: Number(item.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('User Service Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User service running on port ${PORT}`);
});

export default app;