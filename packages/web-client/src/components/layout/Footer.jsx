/**
 * TerraFusionPro - Footer Component
 * Provides the application footer with links and copyright info
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-logo">
            <img 
              src="/logo-small.svg" 
              alt="TerraFusionPro" 
              className="footer-logo-image"
            />
            <div className="footer-logo-text">TerraFusionPro</div>
          </div>
          
          <div className="footer-navigation">
            <div className="footer-nav-group">
              <h3 className="footer-nav-title">Platform</h3>
              <ul className="footer-nav-list">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/properties">Properties</Link></li>
                <li><Link to="/reports">Reports</Link></li>
                <li><Link to="/market-analysis">Market Analysis</Link></li>
              </ul>
            </div>
            
            <div className="footer-nav-group">
              <h3 className="footer-nav-title">Resources</h3>
              <ul className="footer-nav-list">
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/documentation">Documentation</Link></li>
                <li><Link to="/api-docs">API Reference</Link></li>
                <li><Link to="/status">System Status</Link></li>
              </ul>
            </div>
            
            <div className="footer-nav-group">
              <h3 className="footer-nav-title">Company</h3>
              <ul className="footer-nav-list">
                <li><a href="https://terrafusionpro.com/about" target="_blank" rel="noopener noreferrer">About Us</a></li>
                <li><a href="https://terrafusionpro.com/contact" target="_blank" rel="noopener noreferrer">Contact</a></li>
                <li><a href="https://terrafusionpro.com/careers" target="_blank" rel="noopener noreferrer">Careers</a></li>
                <li><a href="https://terrafusionpro.com/blog" target="_blank" rel="noopener noreferrer">Blog</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-legal">
            <div className="copyright">
              &copy; {currentYear} TerraFusionPro. All rights reserved.
            </div>
            
            <div className="legal-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/security">Security</Link>
            </div>
          </div>
          
          <div className="footer-version">
            <span className="version-label">Version</span>
            <span className="version-number">1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;