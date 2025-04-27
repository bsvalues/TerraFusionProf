/**
 * TerraFusionPro - Main Application Component
 * Provides the primary application structure and routing
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import MinimalLayout from './layouts/MinimalLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import PropertyCreate from './pages/PropertyCreate';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import ReportCreate from './pages/ReportCreate';
import FieldData from './pages/FieldData';
import MarketAnalysis from './pages/MarketAnalysis';
import DataSync from './pages/DataSync';
import FileUpload from './pages/FileUpload';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

// Components
import LoadingScreen from './components/ui/LoadingScreen';

/**
 * Protected Route component for authenticated routes
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * Public Route component for unauthenticated routes
 * Redirects to dashboard if already logged in
 */
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

/**
 * Main App component with routing configuration
 */
const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Authenticated Routes - Main Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Property Routes */}
              <Route path="properties" element={<Properties />} />
              <Route path="properties/new" element={<PropertyCreate />} />
              <Route path="properties/:id" element={<PropertyDetail />} />
              
              {/* Report Routes */}
              <Route path="reports" element={<Reports />} />
              <Route path="reports/new" element={<ReportCreate />} />
              <Route path="reports/:id" element={<ReportDetail />} />
              
              {/* Data Collection Routes */}
              <Route path="field-data" element={<FieldData />} />
              
              {/* Analysis Routes */}
              <Route path="market-analysis" element={<MarketAnalysis />} />
              
              {/* Data Management Routes */}
              <Route path="upload" element={<FileUpload />} />
              <Route path="sync" element={<DataSync />} />
              
              {/* Settings Routes */}
              <Route path="settings" element={<Settings />} />
              <Route path="settings/:section" element={<Settings />} />
            </Route>
            
            {/* Authentication Routes - Minimal Layout */}
            <Route element={<MinimalLayout />}>
              <Route path="login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Global Toast Notifications */}
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;