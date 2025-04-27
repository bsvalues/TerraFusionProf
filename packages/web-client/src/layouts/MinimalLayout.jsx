/**
 * TerraFusionPro - Minimal Layout Component
 * Provides a simplified layout for authentication pages and other standalone pages
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const MinimalLayout = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`minimal-layout ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="minimal-header">
        <div className="container">
          <div className="logo">
            <Link to="/">
              <img 
                src={theme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg'} 
                alt="TerraFusionPro" 
                className="logo-image"
              />
            </Link>
          </div>
          
          <div className="header-actions">
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      
      <main className="minimal-content">
        <Outlet />
      </main>
      
      <footer className="minimal-footer">
        <div className="container">
          <div className="footer-content">
            <p className="copyright">
              &copy; {new Date().getFullYear()} TerraFusionPro. All rights reserved.
            </p>
            
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/help">Help Center</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MinimalLayout;