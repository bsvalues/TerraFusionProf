/**
 * TerraFusionPro Web Client - Header Component
 */

import React from 'react';

const Header = () => {
  return (
    <header className="navbar">
      <div className="logo">
        <svg width="180" height="45" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M45 15L30 5L15 15V35L30 45L45 35V15Z" fill="#2563EB"/>
            <path d="M30 5L15 15V35L30 45V25L45 15V35L30 45L45 35V15L30 5Z" fill="#1E40AF"/>
            <path d="M30 5V25L15 15L30 5Z" fill="#60A5FA"/>
            <path d="M30 25L30 45L15 35V15L30 25Z" fill="#3B82F6"/>
          </g>
        </svg>
      </div>
      <nav className="nav-links">
        <a href="/" className="btn btn-text">Dashboard</a>
        <a href="/properties" className="btn btn-text">Properties</a>
        <a href="/reports" className="btn btn-text">Reports</a>
        <a href="/analysis" className="btn btn-text">Analysis</a>
        <a href="/account" className="btn btn-primary">My Account</a>
      </nav>
    </header>
  );
};

export default Header;