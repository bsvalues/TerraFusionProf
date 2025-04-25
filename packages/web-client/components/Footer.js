/**
 * TerraFusionPro Web Client - Footer Component
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>TerraFusionPro</h3>
            <p>Next-generation real estate appraisal platform combining field data collection, geospatial analysis, and AI-powered valuation tools.</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/reports">Reports</Link></li>
              <li><Link to="/analysis">Analysis</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <ul className="footer-links">
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/api-docs">API Documentation</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="mailto:support@terrafusionpro.com">support@terrafusionpro.com</a></li>
              <li><a href="tel:+1-555-123-4567">+1 (555) 123-4567</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} TerraFusionPro. All rights reserved.</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;