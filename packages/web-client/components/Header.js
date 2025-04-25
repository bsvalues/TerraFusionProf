/**
 * TerraFusionPro Web Client - Header Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="navbar">
      <div className="logo">
        <Link to="/">
          <svg width="180" height="45" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path d="M45 15L30 5L15 15V35L30 45L45 35V15Z" fill="#2563EB"/>
              <path d="M30 5L15 15V35L30 45V25L45 15V35L30 45L45 35V15L30 5Z" fill="#1E40AF"/>
              <path d="M30 5V25L15 15L30 5Z" fill="#60A5FA"/>
              <path d="M30 25L30 45L15 35V15L30 25Z" fill="#3B82F6"/>
            </g>
            <text x="60" y="35" fill="#2563EB" fontSize="24" fontWeight="bold">TerraFusionPro</text>
          </svg>
        </Link>
      </div>
      
      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/" className="btn btn-text">Dashboard</Link>
            <Link to="/properties" className="btn btn-text">Properties</Link>
            <Link to="/reports" className="btn btn-text">Reports</Link>
            <Link to="/analysis" className="btn btn-text">Analysis</Link>
            
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1rem' }}>
              <span style={{ marginRight: '0.5rem' }}>
                {currentUser?.first_name}
              </span>
              <div style={{ position: 'relative' }}>
                <Link to="/account" className="btn btn-outline">
                  My Account
                </Link>
                <button 
                  onClick={handleLogout}
                  className="btn btn-danger"
                  style={{ marginLeft: '0.5rem' }}
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-outline" style={{ marginLeft: '0.5rem' }}>Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;