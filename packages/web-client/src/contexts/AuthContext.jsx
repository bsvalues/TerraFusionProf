/**
 * TerraFusionPro - Authentication Context
 * Manages user authentication state and provides auth-related functions
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { notifications } from '../components/layout/NotificationCenter';

// Create authentication context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
        
        if (token) {
          // Verify token and get current user
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.user);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('terraFusionToken');
            sessionStorage.removeItem('terraFusionToken');
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Authentication service unavailable');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token based on remember me preference
      const { token, user } = data;
      if (rememberMe) {
        localStorage.setItem('terraFusionToken', token);
      } else {
        sessionStorage.setItem('terraFusionToken', token);
      }
      
      setCurrentUser(user);
      notifications.success('Login successful!', { title: 'Welcome back' });
      
      return user;
    } catch (err) {
      setError(err.message);
      notifications.error(err.message, { title: 'Login Failed' });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      notifications.success('Registration successful! Please log in.', { title: 'Welcome!' });
      return data;
    } catch (err) {
      setError(err.message);
      notifications.error(err.message, { title: 'Registration Failed' });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API endpoint
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Clear tokens and user state
      localStorage.removeItem('terraFusionToken');
      sessionStorage.removeItem('terraFusionToken');
      setCurrentUser(null);
      
      notifications.info('You have been logged out', { title: 'Logged Out' });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }
      
      setCurrentUser(data.user);
      notifications.success('Profile updated successfully', { title: 'Profile Updated' });
      
      return data.user;
    } catch (err) {
      setError(err.message);
      notifications.error(err.message, { title: 'Update Failed' });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }
      
      notifications.success('Password changed successfully', { title: 'Password Updated' });
      
      return true;
    } catch (err) {
      setError(err.message);
      notifications.error(err.message, { title: 'Password Change Failed' });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password request
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }
      
      notifications.success('Password reset email sent. Please check your inbox.', { title: 'Reset Email Sent' });
      
      return true;
    } catch (err) {
      setError(err.message);
      notifications.error(err.message, { title: 'Reset Request Failed' });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      
      notifications.success('Password reset successful. You can now log in with your new password.', { title: 'Password Reset' });
      
      return true;
    } catch (err) {
      setError(err.message);
      notifications.error(err.message, { title: 'Reset Failed' });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Provide authentication values and functions
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;