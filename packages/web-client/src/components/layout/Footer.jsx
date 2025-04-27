/**
 * TerraFusionPro - Footer Component
 * Application footer with links and copyright information
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-copyright">
        &copy; {currentYear} TerraFusionPro. All rights reserved.
      </div>
      
      <div className="footer-links">
        <Link to="/help" className="footer-link">Help</Link>
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        <Link to="/terms" className="footer-link">Terms of Service</Link>
        <a 
          href="https://terrafusionpro.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="footer-link"
        >
          About
        </a>
      </div>
      
      <div className="footer-version">
        Version 1.0.0
      </div>
    </footer>
  );
};

export default Footer;