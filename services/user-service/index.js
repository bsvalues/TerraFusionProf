/**
 * TerraFusionPro User Service
 * 
 * This service handles user management, authentication, authorization,
 * and role-based access control.
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema, initializeDatabase } from '../../packages/shared/storage.js';
import { eq } from 'drizzle-orm';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5002;

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await initializeDatabase();
    
    res.json({
      service: 'user-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      service: 'user-service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Register new user
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'appraiser', organization, phone } = req.body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create new user
    const [newUser] = await db.insert(schema.users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        organization,
        phone,
        lastLogin: new Date()
      })
      .returning({
        id: schema.users.id,
        uuid: schema.users.uuid,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        organization: schema.users.organization,
        createdAt: schema.users.createdAt
      });
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: newUser.id,
        uuid: newUser.uuid,
        email: newUser.email,
        role: newUser.role,
        name: `${newUser.firstName} ${newUser.lastName}`
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await db.update(schema.users)
      .set({ lastLogin: new Date() })
      .where(eq(schema.users.id, user.id));
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization
      },
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
app.get('/users/me', async (req, res) => {
  try {
    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user data
      const [user] = await db.select({
        id: schema.users.id,
        uuid: schema.users.uuid,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        organization: schema.users.organization,
        phone: schema.users.phone,
        createdAt: schema.users.createdAt,
        lastLogin: schema.users.lastLogin,
        preferences: schema.users.preferences
      })
      .from(schema.users)
      .where(eq(schema.users.id, decoded.id));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get all users (admin only)
app.get('/users', async (req, res) => {
  try {
    // Get user role from auth token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }
      
      // Query params
      const { page = 1, limit = 10, role } = req.query;
      const offset = (page - 1) * limit;
      
      // Build query
      let query = db.select({
        id: schema.users.id,
        uuid: schema.users.uuid,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        organization: schema.users.organization,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        lastLogin: schema.users.lastLogin
      })
      .from(schema.users);
      
      // Filter by role if provided
      if (role) {
        query = query.where(eq(schema.users.role, role));
      }
      
      // Add pagination
      query = query.limit(limit).offset(offset);
      
      // Execute query
      const users = await query;
      
      // Count total users
      const countQuery = role
        ? db.select({ count: db.fn.count() }).from(schema.users).where(eq(schema.users.role, role))
        : db.select({ count: db.fn.count() }).from(schema.users);
        
      const [{ count }] = await countQuery;
      
      res.json({
        data: users,
        pagination: {
          total: Number(count),
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(Number(count) / limit)
        }
      });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // Get user from auth token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user is updating their own profile or is an admin
      if (decoded.id.toString() !== id && decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - Can only update own profile or admin access required' });
      }
      
      // Don't allow role changes unless admin
      if (userData.role && decoded.role !== 'admin') {
        delete userData.role;
      }
      
      // Don't update password through this endpoint
      if (userData.password || userData.passwordHash) {
        delete userData.password;
        delete userData.passwordHash;
      }
      
      // Update user
      const [updatedUser] = await db.update(schema.users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, id))
        .returning({
          id: schema.users.id,
          uuid: schema.users.uuid,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          role: schema.users.role,
          organization: schema.users.organization,
          phone: schema.users.phone,
          isActive: schema.users.isActive,
          updatedAt: schema.users.updatedAt
        });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Change password
app.post('/auth/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Basic validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Get user from auth token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user with password hash
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.id, decoded.id));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      // Update password
      await db.update(schema.users)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, decoded.id));
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User service running on port ${PORT}`);
});

export default app;