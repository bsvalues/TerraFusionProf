/**
 * TerraFusionPro - Main Layout Component
 * Provides consistent layout structure for most application pages
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { initializeNotifications } from '../components/layout/NotificationCenter';

/**
 * MainLayout Component
 * @param {Object} props - Component props
 * @param {boolean} props.fullWidth - Whether to use full width content area
 * @param {boolean} props.showBreadcrumbs - Whether to show breadcrumbs
 * @param {Object} props.breadcrumbProps - Props to pass to Breadcrumbs component
 */
const MainLayout = ({
  fullWidth = false,
  showBreadcrumbs = true,
  breadcrumbProps = {}
}) => {
  const { currentUser, checkAuthState } = useAuth();
  const { theme } = useTheme();
  
  // Check authentication state on mount
  useEffect(() => {
    checkAuthState();
    initializeNotifications();
  }, []);
  
  return (
    <div className={`app-container ${theme}-theme`}>
      <Header />
      
      <div className="main-content-wrapper">
        <Sidebar />
        
        <main className={`main-content ${fullWidth ? 'full-width' : ''}`}>
          {showBreadcrumbs && <Breadcrumbs {...breadcrumbProps} />}
          
          <div className="content-container">
            <Outlet />
          </div>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;