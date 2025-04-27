/**
 * TerraFusionPro - App Routes
 * Defines the application's routing structure
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';
import MinimalLayout from '../layouts/MinimalLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Error Pages
import NotFoundPage from '../pages/errors/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return children;
};

// Public Route Component (accessible only when not authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes (public) */}
      <Route path="/auth/*" element={<MinimalLayout />}>
        <Route path="login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>
      
      {/* Main App Routes (protected) */}
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* Dashboard Routes */}
        <Route path="dashboard" element={<div>Dashboard</div>} />
        
        {/* Properties Routes */}
        <Route path="properties" element={<div>Properties</div>} />
        <Route path="properties/:id" element={<div>Property Details</div>} />
        
        {/* Reports Routes */}
        <Route path="reports" element={<div>Reports</div>} />
        <Route path="reports/:id" element={<div>Report Details</div>} />
        
        {/* Forms Routes */}
        <Route path="forms" element={<div>Forms</div>} />
        <Route path="forms/:id" element={<div>Form Details</div>} />
        
        {/* Analysis Routes */}
        <Route path="analysis" element={<div>Analysis</div>} />
        <Route path="analysis/:id" element={<div>Analysis Details</div>} />
        
        {/* User Profile Routes */}
        <Route path="profile" element={<div>User Profile</div>} />
        <Route path="settings" element={<div>Settings</div>} />
        
        {/* Help/Support Routes */}
        <Route path="help" element={<div>Help Center</div>} />
        <Route path="help/:topic" element={<div>Help Topic</div>} />
        
        {/* Default redirect for the app root */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 for any unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;