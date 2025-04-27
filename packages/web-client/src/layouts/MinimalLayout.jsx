/**
 * TerraFusionPro - Minimal Layout Component
 * Provides a simplified layout structure for login, registration, and other standalone pages
 */

import React, { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { initializeNotifications } from '../components/layout/NotificationCenter';

/**
 * MinimalLayout Component
 * @param {Object} props - Component props
 * @param {boolean} props.showHeader - Whether to show minimal header
 * @param {boolean} props.showFooter - Whether to show minimal footer
 * @param {string} props.backgroundClass - Custom background class
 */
const MinimalLayout = ({
  showHeader = true,
  showFooter = true,
  backgroundClass = ''
}) => {
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    initializeNotifications();
  }, []);
  
  return (
    <div className={`minimal-container ${theme}-theme ${backgroundClass}`}>
      {showHeader && (
        <header className="minimal-header">
          <div className="logo-container">
            <Link to="/" className="logo-link">
              <img 
                src="/assets/images/terrafusion-logo.svg" 
                alt="TerraFusionPro Logo" 
                className="logo-image" 
              />
              <span className="logo-text">TerraFusionPro</span>
            </Link>
          </div>
          
          <div className="minimal-actions">
            <button 
              className="theme-toggle"
              onClick={() => theme === 'light' ? setTheme('dark') : setTheme('light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>
          </div>
        </header>
      )}
      
      <main className="minimal-content">
        <Outlet />
      </main>
      
      {showFooter && (
        <footer className="minimal-footer">
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Help Center</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          
          <div className="copyright">
            &copy; {new Date().getFullYear()} TerraFusionPro. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
};

export default MinimalLayout;