/**
 * TerraFusionPro - Sidebar Component
 * Provides application navigation with collapsible sections
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ 
  navigationItems, 
  isOpen, 
  isMobile, 
  toggleSidebar, 
  closeMobileMenu, 
  currentPath 
}) => {
  const [expandedItems, setExpandedItems] = useState({});
  const location = useLocation();
  
  // Initialize expanded state based on current route
  useEffect(() => {
    const newExpandedState = {};
    
    navigationItems.forEach(item => {
      if (item.children) {
        const isActive = item.children.some(child => 
          child.path === currentPath || 
          (currentPath.startsWith(child.path + '/') && child.path !== '/')
        );
        
        if (isActive) {
          newExpandedState[item.id] = true;
        }
      }
    });
    
    setExpandedItems(newExpandedState);
  }, []);
  
  // Toggle expansion state of an item
  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Check if a nav item is active
  const isItemActive = (path) => {
    if (path === currentPath) return true;
    if (path !== '/' && currentPath.startsWith(path + '/')) return true;
    return false;
  };
  
  // Render navigation items recursively
  const renderNavItems = (items, level = 0) => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isActive = isItemActive(item.path);
      const isExpanded = expandedItems[item.id];
      
      return (
        <li 
          key={item.id} 
          className={`nav-item ${isActive ? 'active' : ''} ${level > 0 ? 'nav-child-item' : ''}`}
        >
          {hasChildren ? (
            <>
              <button 
                className={`nav-link nav-parent ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleItemExpansion(item.id)}
              >
                {item.icon && <item.icon className="nav-icon" />}
                <span className="nav-label">{item.label}</span>
                <span className="nav-arrow">{isExpanded ? '▼' : '▶'}</span>
              </button>
              
              {isExpanded && (
                <ul className="sub-nav">
                  {renderNavItems(item.children, level + 1)}
                </ul>
              )}
            </>
          ) : (
            <Link 
              to={item.path} 
              className="nav-link"
              onClick={isMobile ? closeMobileMenu : undefined}
            >
              {item.icon && <item.icon className="nav-icon" />}
              <span className="nav-label">{item.label}</span>
            </Link>
          )}
        </li>
      );
    });
  };
  
  return (
    <aside className={`sidebar ${isOpen ? '' : 'collapsed'} ${isMobile ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Link to="/dashboard">
            <img 
              src="/logo.svg" 
              alt="TerraFusionPro" 
              className="logo-image"
            />
            <span className="logo-text">TerraFusionPro</span>
          </Link>
        </div>
        
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>
      
      <div className="sidebar-user">
        <Link to="/profile" className="user-profile-link">
          <div className="user-avatar">
            <span className="avatar-text">J</span>
          </div>
          <div className="user-info">
            <div className="user-name">John Doe</div>
            <div className="user-role">Administrator</div>
          </div>
        </Link>
      </div>
      
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {renderNavItems(navigationItems)}
          </ul>
        </nav>
      </div>
      
      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot online"></span>
          <span className="status-text">System Online</span>
        </div>
        
        <div className="version-info">
          Version 1.0.0
        </div>
      </div>
      
      {isMobile && (
        <div className="mobile-sidebar-backdrop" onClick={closeMobileMenu}></div>
      )}
    </aside>
  );
};

export default Sidebar;