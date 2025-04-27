/**
 * TerraFusionPro - Sidebar Component
 * Provides secondary navigation and context-sensitive menu items
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Sidebar navigation items
 */
const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )
  },
  {
    id: 'properties',
    label: 'Properties',
    path: '/properties',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    submenu: [
      { id: 'all-properties', label: 'All Properties', path: '/properties' },
      { id: 'add-property', label: 'Add Property', path: '/properties/new' },
      { id: 'property-map', label: 'Property Map', path: '/properties/map' },
      { id: 'property-search', label: 'Advanced Search', path: '/properties/search' }
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    submenu: [
      { id: 'all-reports', label: 'All Reports', path: '/reports' },
      { id: 'create-report', label: 'Create Report', path: '/reports/new' },
      { id: 'report-templates', label: 'Templates', path: '/reports/templates' },
      { id: 'report-archive', label: 'Archive', path: '/reports/archive' }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    submenu: [
      { id: 'market-trends', label: 'Market Trends', path: '/analytics/market' },
      { id: 'property-insights', label: 'Property Insights', path: '/analytics/properties' },
      { id: 'sales-comps', label: 'Sales Comparables', path: '/analytics/comps' },
      { id: 'custom-analysis', label: 'Custom Analysis', path: '/analytics/custom' }
    ]
  },
  {
    id: 'data',
    label: 'Data Management',
    path: '/data',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
      </svg>
    ),
    submenu: [
      { id: 'data-sources', label: 'Data Sources', path: '/data/sources' },
      { id: 'import-data', label: 'Import Data', path: '/data/import' },
      { id: 'export-data', label: 'Export Data', path: '/data/export' },
      { id: 'data-quality', label: 'Data Quality', path: '/data/quality' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    )
  }
];

/**
 * Sidebar Component
 */
const Sidebar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  
  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path ||
      location.pathname.startsWith(`${path}/`);
  };
  
  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };
  
  // Toggle submenu expanded state
  const toggleSubmenu = (id) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Auto-expand submenu of active parent item
  useEffect(() => {
    const activeParent = NAVIGATION_ITEMS.find(item => 
      item.submenu && item.submenu.some(sub => isActive(sub.path))
    );
    
    if (activeParent && !expandedMenus[activeParent.id]) {
      setExpandedMenus(prev => ({
        ...prev,
        [activeParent.id]: true
      }));
    }
  }, [location.pathname]);
  
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-toggle"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
            {collapsed ? (
              <polyline points="13 17 18 12 13 7"></polyline>
            ) : (
              <polyline points="11 17 6 12 11 7"></polyline>
            )}
          </svg>
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-items">
          {NAVIGATION_ITEMS.map(item => (
            <li 
              key={item.id} 
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.submenu ? (
                <>
                  <button 
                    className="nav-button"
                    onClick={() => toggleSubmenu(item.id)}
                    aria-expanded={expandedMenus[item.id]}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        <span className="submenu-indicator">
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                            <polyline points={expandedMenus[item.id] ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                          </svg>
                        </span>
                      </>
                    )}
                  </button>
                  
                  {expandedMenus[item.id] && !collapsed && (
                    <ul className="submenu">
                      {item.submenu.map(subItem => (
                        <li 
                          key={subItem.id} 
                          className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                        >
                          <Link to={subItem.path} className="submenu-link">
                            <span className="submenu-label">{subItem.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link to={item.path} className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">
                {currentUser?.displayName || 'User'}
              </div>
              <div className="user-role">
                {currentUser?.role || 'Appraiser'}
              </div>
            </div>
          </div>
        )}
        
        <div className="sidebar-actions">
          <Link 
            to="/help" 
            className="action-button help-button"
            title="Help & Support"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </Link>
          
          <Link 
            to="/settings" 
            className="action-button settings-button"
            title="Settings"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;