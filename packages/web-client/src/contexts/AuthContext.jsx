/**
 * TerraFusionPro - Auth Context
 * Manages authentication state throughout the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create the auth context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();
  
  // Check authentication state
  const checkAuthState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for token in storage
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      
      if (!token) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Validate token with API
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Token is invalid, clear it
        localStorage.removeItem('terraFusionToken');
        sessionStorage.removeItem('terraFusionToken');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Token is valid, set user state
      const userData = await response.json();
      setCurrentUser(userData.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking auth state:', error);
      setError('Failed to verify authentication. Please try again.');
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Login handler
  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Handle successful login
      const data = await response.json();
      
      // Store token in appropriate storage
      if (rememberMe) {
        localStorage.setItem('terraFusionToken', data.token);
      } else {
        sessionStorage.setItem('terraFusionToken', data.token);
      }
      
      // Update state
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout handler
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API if needed (e.g., to invalidate token server-side)
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(err => console.warn('Logout API error:', err));
      }
      
      // Clear local storage
      localStorage.removeItem('terraFusionToken');
      sessionStorage.removeItem('terraFusionToken');
      
      // Update state
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Register handler
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Handle successful registration
      const data = await response.json();
      
      // Store token in session storage by default for new registrations
      sessionStorage.setItem('terraFusionToken', data.token);
      
      // Update state
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      
      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('terraFusionToken') || sessionStorage.getItem('terraFusionToken');
      
      if (!token) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Call update profile API
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      // Handle successful update
      const data = await response.json();
      
      // Update local user state
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...data.user
      }));
      
      return data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
      throw error;
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
      
      if (!token) {
        throw new Error('You must be logged in to change your password');
      }
      
      // Call change password API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.message || 'Failed to change password. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call reset password API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has a specific role/permission
  const hasRole = (role) => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes(role);
  };
  
  // Check auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    resetPassword,
    checkAuthState,
    hasRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;