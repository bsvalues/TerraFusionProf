/**
 * TerraFusionPro Web Client - Authentication Context
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated authentication state - in a real app, this would check with a backend
  useEffect(() => {
    // Check for stored user in localStorage or session
    const storedUser = localStorage.getItem('terraFusionUser');
    
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    // This would be an API call in a real application
    // Simulate successful login for now
    const user = {
      id: '123456',
      name: 'Demo User',
      email: email,
      role: 'appraiser'
    };
    
    setCurrentUser(user);
    localStorage.setItem('terraFusionUser', JSON.stringify(user));
    return user;
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('terraFusionUser');
  };

  // Registration function
  const register = async (name, email, password) => {
    // This would be an API call in a real application
    // Simulate successful registration for now
    const user = {
      id: '123456',
      name: name,
      email: email,
      role: 'appraiser'
    };
    
    setCurrentUser(user);
    localStorage.setItem('terraFusionUser', JSON.stringify(user));
    return user;
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;