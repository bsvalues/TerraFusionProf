/**
 * TerraFusionPro - App Routes
 * Defines application routing and layout structure
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

// Main Pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Render children if authenticated
  return children;
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Minimal Layout */}
      <Route element={<MinimalLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>
      
      {/* Protected Routes with Main Layout */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Properties Routes */}
        <Route path="/properties" element={<Navigate to="/properties/list" replace />} />
        <Route path="/properties/list" element={<div>Properties List</div>} />
        <Route path="/properties/new" element={<div>New Property</div>} />
        <Route path="/properties/:id" element={<div>Property Details</div>} />
        <Route path="/properties/:id/edit" element={<div>Edit Property</div>} />
        <Route path="/properties/map" element={<div>Property Map</div>} />
        
        {/* Reports Routes */}
        <Route path="/reports" element={<Navigate to="/reports/list" replace />} />
        <Route path="/reports/list" element={<div>Reports List</div>} />
        <Route path="/reports/new" element={<div>New Report</div>} />
        <Route path="/reports/:id" element={<div>Report Details</div>} />
        <Route path="/reports/:id/edit" element={<div>Edit Report</div>} />
        <Route path="/reports/templates" element={<div>Report Templates</div>} />
        
        {/* Analytics Routes */}
        <Route path="/analytics" element={<Navigate to="/analytics/overview" replace />} />
        <Route path="/analytics/overview" element={<div>Analytics Overview</div>} />
        <Route path="/analytics/market" element={<div>Market Analysis</div>} />
        <Route path="/analytics/properties" element={<div>Property Analytics</div>} />
        <Route path="/analytics/comps" element={<div>Comparable Analysis</div>} />
        
        {/* Data Management Routes */}
        <Route path="/data" element={<Navigate to="/data/sources" replace />} />
        <Route path="/data/sources" element={<div>Data Sources</div>} />
        <Route path="/data/import" element={<div>Import Data</div>} />
        <Route path="/data/export" element={<div>Export Data</div>} />
        <Route path="/data/quality" element={<div>Data Quality</div>} />
        
        {/* User Profile Routes */}
        <Route path="/profile" element={<div>User Profile</div>} />
        <Route path="/profile/edit" element={<div>Edit Profile</div>} />
        <Route path="/profile/password" element={<div>Change Password</div>} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<div>Settings</div>} />
        <Route path="/settings/account" element={<div>Account Settings</div>} />
        <Route path="/settings/notifications" element={<div>Notification Settings</div>} />
        <Route path="/settings/integrations" element={<div>Integrations</div>} />
        
        {/* System Routes */}
        <Route path="/system/health" element={<div>System Health</div>} />
        <Route path="/system/status" element={<div>System Status</div>} />
        
        {/* Help Routes */}
        <Route path="/help" element={<div>Help Center</div>} />
        <Route path="/help/login" element={<div>Login Help</div>} />
        <Route path="/help/documentation" element={<div>Documentation</div>} />
        <Route path="/help/support" element={<div>Support</div>} />
      </Route>
      
      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;