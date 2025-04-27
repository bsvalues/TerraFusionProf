/**
 * TerraFusionPro - Main Header Component
 * Provides application header with navigation and user controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ 
  pageTitle, 
  toggleSidebar, 
  toggleMobileMenu,
  sidebarOpen, 
  user 
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);
  
  // Fetch notifications on component mount
  useEffect(() => {
    // Simulated fetch of notifications
    // In a real app, you would fetch from an API
    const fetchNotifications = async () => {
      try {
        // Mock notifications data
        const mockNotifications = [
          {
            id: 1,
            type: 'report',
            title: 'Report Ready for Review',
            message: 'A new report has been submitted for your review.',
            time: '10 min ago',
            read: false
          },
          {
            id: 2,
            type: 'property',
            title: 'Property Data Updated',
            message: 'The property at 123 Main St has been updated with new information.',
            time: '1 hour ago',
            read: false
          },
          {
            id: 3,
            type: 'system',
            title: 'System Maintenance',
            message: 'Scheduled maintenance will occur tonight at 11 PM PST.',
            time: '3 hours ago',
            read: true
          }
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
  }, []);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    
    // Simple search simulation
    // In a real app, you would fetch search results from an API
    if (e.target.value.trim()) {
      // Mock search results
      const results = [
        { id: 1, type: 'property', title: '123 Main St, San Francisco, CA', link: '/properties/1' },
        { id: 2, type: 'report', title: 'Residential Appraisal - 123 Main St', link: '/reports/1' },
        { id: 3, type: 'property', title: '456 Market St, San Francisco, CA', link: '/properties/2' }
      ].filter(item => 
        item.title.toLowerCase().includes(e.target.value.toLowerCase())
      );
      
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark notification as read
    setNotifications(
      notifications.map(item => 
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
    
    // Navigate based on notification type
    if (notification.type === 'report') {
      navigate('/reports');
    } else if (notification.type === 'property') {
      navigate('/properties');
    }
    
    setNotificationsOpen(false);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="header-left">
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          
          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>
          
          <h1 className="page-title">{pageTitle}</h1>
        </div>
        
        <div className="header-right">
          <div className="header-actions">
            {/* Search */}
            <div className="search-container" ref={searchRef}>
              <button 
                className="action-btn search-btn" 
                onClick={() => setSearchOpen(prev => !prev)}
                aria-label="Search"
              >
                🔍
              </button>
              
              {searchOpen && (
                <div className="search-dropdown">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search properties, reports..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(result => (
                        <Link 
                          key={result.id} 
                          to={result.link}
                          className="search-result-item"
                          onClick={() => setSearchOpen(false)}
                        >
                          <span className="search-result-type">{result.type}</span>
                          <span className="search-result-title">{result.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {searchQuery && searchResults.length === 0 && (
                    <div className="search-no-results">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Notifications */}
            <div className="notifications-container" ref={notificationsRef}>
              <button 
                className="action-btn notification-btn" 
                onClick={() => setNotificationsOpen(prev => !prev)}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3 className="notifications-title">Notifications</h3>
                    <button 
                      className="mark-all-read-btn"
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })));
                      }}
                    >
                      Mark all as read
                    </button>
                  </div>
                  
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-icon">
                            {notification.type === 'report' && '📄'}
                            {notification.type === 'property' && '🏠'}
                            {notification.type === 'system' && '⚙️'}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">{notification.title}</div>
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-time">{notification.time}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">
                        No notifications
                      </div>
                    )}
                  </div>
                  
                  <div className="notifications-footer">
                    <Link 
                      to="/notifications" 
                      className="view-all-link"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Theme Toggle */}
            <button 
              className="action-btn theme-btn" 
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* User Menu */}
            <div className="user-menu-container" ref={userMenuRef}>
              <button 
                className="user-menu-btn" 
                onClick={() => setUserMenuOpen(prev => !prev)}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={`${user.first_name} ${user.last_name}`} 
                      className="avatar-image"
                    />
                  ) : (
                    <span className="avatar-initials">
                      {user?.first_name?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <span className="user-name">
                  {user?.first_name || 'User'}
                </span>
                <span className="menu-arrow">▼</span>
              </button>
              
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-info">
                      <div className="user-name">{user?.first_name} {user?.last_name}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  
                  <div className="user-dropdown-content">
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="dropdown-item-icon">👤</span>
                      <span className="dropdown-item-text">My Profile</span>
                    </Link>
                    
                    <Link 
                      to="/settings" 
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="dropdown-item-icon">⚙️</span>
                      <span className="dropdown-item-text">Settings</span>
                    </Link>
                    
                    <Link 
                      to="/help" 
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="dropdown-item-icon">❓</span>
                      <span className="dropdown-item-text">Help Center</span>
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout-btn" 
                      onClick={handleLogout}
                    >
                      <span className="dropdown-item-icon">🚪</span>
                      <span className="dropdown-item-text">Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;