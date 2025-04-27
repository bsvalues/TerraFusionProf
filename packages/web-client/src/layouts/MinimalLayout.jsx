/**
 * TerraFusionPro - Minimal Layout Component
 * Simplified layout for non-authenticated pages like login, register, etc.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import NotificationCenter from '../components/layout/NotificationCenter';

/**
 * MinimalLayout Component
 * Provides a simplified layout for auth pages and error pages
 */
const MinimalLayout = () => {
  return (
    <div className="minimal-layout">
      <div className="minimal-container">
        <Outlet />
      </div>
      
      <NotificationCenter />
    </div>
  );
};

export default MinimalLayout;