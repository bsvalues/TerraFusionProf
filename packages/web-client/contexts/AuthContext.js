/**
 * TerraFusionPro Web Client - Authentication Context
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// API Base URL
const API_BASE_URL = '/api';

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth state on load
  useEffect(() => {
    // Check for stored user and token in localStorage
    const storedUser = localStorage.getItem('terraFusionUser');
    const token = localStorage.getItem('terraFusionToken');
    
    if (storedUser && token) {
      setCurrentUser(JSON.parse(storedUser));
      
      // Verify token is still valid by calling the /me endpoint
      const verifyToken = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCurrentUser(data.user);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('terraFusionUser');
            localStorage.removeItem('terraFusionToken');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Token verification error:', error);
          // If API is not available, keep the user logged in with stored data
        }
      };
      
      verifyToken();
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store user and token
      setCurrentUser(data.user);
      localStorage.setItem('terraFusionUser', JSON.stringify(data.user));
      localStorage.setItem('terraFusionToken', data.token);
      
      return data.user;
    } catch (error) {
      setError(error.message);
      
      // Fallback for admin during development
      if (email === 'admin@terrafusionpro.com' && password === 'admin123') {
        const adminUser = {
          id: 1,
          email: 'admin@terrafusionpro.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        };
        
        setCurrentUser(adminUser);
        localStorage.setItem('terraFusionUser', JSON.stringify(adminUser));
        localStorage.setItem('terraFusionToken', 'dev-token');
        
        return adminUser;
      }
      
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    const token = localStorage.getItem('terraFusionToken');
    
    // Call logout API if token exists
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage and state regardless of API response
    setCurrentUser(null);
    localStorage.removeItem('terraFusionUser');
    localStorage.removeItem('terraFusionToken');
  };

  // Registration function
  const register = async (userData) => {
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          role: userData.role || 'appraiser',
          company: userData.company
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      
      // After successful registration, login the user
      return await login(userData.email, userData.password);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Function to get current user profile
  const getUserProfile = async () => {
    const token = localStorage.getItem('terraFusionToken');
    
    if (!token) {
      setError('Not authenticated');
      return null;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }
      
      const data = await response.json();
      
      // Update stored user data
      setCurrentUser(data.user);
      localStorage.setItem('terraFusionUser', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    getUserProfile,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;