/**
 * TerraFusionPro - Auth Context
 * Provides authentication state and functions across the application
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext();

/**
 * AuthProvider Component
 * Provides authentication state and functions
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('auth-token'));
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If we have a token, try to get the user profile
        if (authToken) {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear auth state
            localStorage.removeItem('auth-token');
            setAuthToken(null);
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No token, user is not authenticated
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error checking authentication status:', err);
        setError('Failed to authenticate. Please try again.');
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('auth-token');
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [authToken]);
  
  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
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
        throw new Error(data.message || 'Failed to login');
      }
      
      // Save token to localStorage
      localStorage.setItem('auth-token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
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
        throw new Error(data.message || 'Failed to register');
      }
      
      // Auto-login after successful registration
      return login(userData.email, userData.password);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint to invalidate the token on the server
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
      
      // Clear auth state
      localStorage.removeItem('auth-token');
      setAuthToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Password reset request function
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
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
        throw new Error(data.message || 'Failed to send password reset email');
      }
      
      return data;
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user profile function
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update current user data
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...data.user
      }));
      
      return data;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      return data;
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const authContextValue = {
    currentUser,
    isLoading,
    error,
    isAuthenticated,
    authToken,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    changePassword
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Custom hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};