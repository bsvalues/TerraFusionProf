/**
 * TerraFusionPro - Main Layout Component
 * Primary layout for authenticated users with header, sidebar and footer
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import NotificationCenter from '../components/layout/NotificationCenter';

/**
 * MainLayout Component
 * Provides the application shell for authenticated pages
 */
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="main-layout">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="content-container">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className={`main-content ${sidebarOpen ? '' : 'full-width'}`}>
          <Breadcrumbs />
          
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>
      
      <NotificationCenter />
      <Footer />
    </div>
  );
};

export default MainLayout;