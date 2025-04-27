/**
 * TerraFusionPro - Footer Component
 * Provides application footer with links and copyright information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import ServiceHealth from '../dashboard/ServiceHealth';

/**
 * Footer Component
 * @param {Object} props - Component props
 * @param {boolean} props.showServiceStatus - Whether to show system status in footer
 */
const Footer = ({ 
  showServiceStatus = true 
}) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section branding">
          <div className="footer-logo">
            <img 
              src="/assets/images/terrafusion-logo.svg" 
              alt="TerraFusionPro Logo" 
              className="footer-logo-image" 
            />
            <span className="footer-logo-text">TerraFusionPro</span>
          </div>
          <div className="footer-tagline">
            Advanced Property Valuation Platform
          </div>
        </div>
        
        {showServiceStatus && (
          <div className="footer-section system-status">
            <div className="status-label">System Status:</div>
            <div className="status-indicator healthy"></div>
            <div className="status-text">All Systems Operational</div>
            <Link to="/system/status" className="status-link">View Details</Link>
          </div>
        )}
        
        <div className="footer-section links">
          <div className="footer-link-group">
            <h4 className="link-group-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">About Us</a></li>
              <li><a href="#" className="footer-link">Contact</a></li>
              <li><a href="#" className="footer-link">Careers</a></li>
              <li><a href="#" className="footer-link">Blog</a></li>
            </ul>
          </div>
          
          <div className="footer-link-group">
            <h4 className="link-group-title">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">API Reference</a></li>
              <li><a href="#" className="footer-link">Community</a></li>
            </ul>
          </div>
          
          <div className="footer-link-group">
            <h4 className="link-group-title">Legal</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Terms of Service</a></li>
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-link">Security</a></li>
              <li><a href="#" className="footer-link">Compliance</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="copyright">
          &copy; {currentYear} TerraFusionPro. All rights reserved.
        </div>
        
        <div className="version">
          Version 1.0.0
        </div>
      </div>
    </footer>
  );
};

export default Footer;