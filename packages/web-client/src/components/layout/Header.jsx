/**
 * TerraFusionPro - Header Component
 * Main application header with navigation and user controls
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from './NotificationCenter';

/**
 * Header Component
 */
const Header = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const notifications = useNotifications();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      notifications.success('You have been successfully logged out');
      navigate('/login');
    } catch (error) {
      notifications.error('Failed to log out. Please try again.');
      console.error('Logout error:', error);
    }
  };
  
  // Toggle user dropdown menu
  const toggleUserMenu = () => {
    setShowUserMenu(prev => !prev);
    if (showNotifications) setShowNotifications(false);
  };
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    if (showUserMenu) setShowUserMenu(false);
  };
  
  return (
    <header className="app-header">
      <div className="header-left">
        {/* Logo and Brand */}
        <div className="brand">
          <Link to="/" className="brand-link">
            <img 
              src="/assets/images/terrafusion-logo.svg" 
              alt="TerraFusionPro Logo" 
              className="brand-logo" 
            />
            <span className="brand-name">TerraFusionPro</span>
          </Link>
        </div>
        
        {/* Main Navigation */}
        <nav className="main-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/properties" className="nav-link">Properties</Link>
            </li>
            <li className="nav-item">
              <Link to="/reports" className="nav-link">Reports</Link>
            </li>
            <li className="nav-item">
              <Link to="/analytics" className="nav-link">Analytics</Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="header-right">
        {/* Search Bar */}
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button" aria-label="Search">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </form>
        
        {/* Theme Toggle */}
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
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
        
        {/* Notifications */}
        <div className="notifications-dropdown">
          <button 
            className="notifications-toggle"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="notification-badge">3</span>
          </button>
          
          {showNotifications && (
            <div className="notifications-panel">
              <div className="notifications-header">
                <h3>Notifications</h3>
                <button className="mark-read-btn">Mark all as read</button>
              </div>
              
              <ul className="notifications-list">
                <li className="notification-item unread">
                  <div className="notification-icon report-icon">📄</div>
                  <div className="notification-content">
                    <div className="notification-message">
                      <strong>Report #1234</strong> has been approved
                    </div>
                    <div className="notification-time">2 hours ago</div>
                  </div>
                </li>
                <li className="notification-item unread">
                  <div className="notification-icon user-icon">👤</div>
                  <div className="notification-content">
                    <div className="notification-message">
                      <strong>John Smith</strong> assigned you a new task
                    </div>
                    <div className="notification-time">Yesterday</div>
                  </div>
                </li>
                <li className="notification-item">
                  <div className="notification-icon system-icon">🔔</div>
                  <div className="notification-content">
                    <div className="notification-message">
                      System maintenance scheduled for tomorrow
                    </div>
                    <div className="notification-time">2 days ago</div>
                  </div>
                </li>
              </ul>
              
              <div className="notifications-footer">
                <Link to="/notifications" className="view-all-link">
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* User Menu */}
        <div className="user-dropdown">
          <button 
            className="user-menu-toggle"
            onClick={toggleUserMenu}
            aria-label="User menu"
          >
            <div className="user-avatar">
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </div>
          </button>
          
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-name">
                  {currentUser?.displayName || 'User'}
                </div>
                <div className="user-email">
                  {currentUser?.email || 'user@example.com'}
                </div>
              </div>
              
              <ul className="user-menu-items">
                <li className="menu-item">
                  <Link to="/profile" className="menu-link">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>My Profile</span>
                  </Link>
                </li>
                <li className="menu-item">
                  <Link to="/settings" className="menu-link">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Settings</span>
                  </Link>
                </li>
                <li className="menu-item">
                  <Link to="/help" className="menu-link">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Help & Support</span>
                  </Link>
                </li>
                <li className="menu-divider"></li>
                <li className="menu-item">
                  <button onClick={handleLogout} className="menu-button logout-button">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Log Out</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;