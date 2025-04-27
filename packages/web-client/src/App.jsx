/**
 * TerraFusionPro - Main App Component
 * Entry point for the React application
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/layout/NotificationCenter';
import AppRoutes from './routes/AppRoutes';

/**
 * App Component
 * Provides context providers and wraps the application with BrowserRouter
 */
const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;