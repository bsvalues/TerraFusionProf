/**
 * TerraFusionPro - Breadcrumbs Component
 * Displays the navigation path for the current page
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Mapping of paths to readable names
 */
const pathNames = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'properties': 'Properties',
  'reports': 'Reports',
  'forms': 'Forms',
  'analysis': 'Analysis',
  'profile': 'Profile',
  'settings': 'Settings',
  'admin': 'Administration',
  'help': 'Help',
  'create': 'Create',
  'edit': 'Edit',
  'view': 'View',
  'map': 'Map',
  'templates': 'Templates',
  'assigned': 'Assigned',
  'builder': 'Form Builder',
  'market': 'Market Analysis',
  'trends': 'Trends',
  'comparables': 'Comparables',
  'users': 'User Management',
  'system-health': 'System Health',
  'activity-logs': 'Activity Logs'
};

/**
 * Get readable name for a path segment
 * @param {string} path - The path segment
 * @return {string} - The readable name
 */
const getReadableName = (path) => {
  // If the path is an ID (UUID or numeric), try to display something meaningful
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(path) || /^\d+$/.test(path)) {
    return 'Details';
  }
  
  return pathNames[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
};

/**
 * Breadcrumbs Component
 */
const Breadcrumbs = () => {
  const location = useLocation();
  
  // If we're at the root path, don't show breadcrumbs
  if (location.pathname === '/') {
    return null;
  }
  
  // Split path into segments and remove empty segments
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items with links
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSegments.length - 1;
    
    return {
      name: getReadableName(segment),
      url,
      isLast
    };
  });
  
  // Always include Home as the first breadcrumb
  breadcrumbItems.unshift({
    name: 'Home',
    url: '/',
    isLast: breadcrumbItems.length === 0
  });
  
  return (
    <nav aria-label="breadcrumb" className="breadcrumbs">
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className={`breadcrumb-item ${item.isLast ? 'active' : ''}`}>
            {item.isLast ? (
              <span>{item.name}</span>
            ) : (
              <Link to={item.url}>{item.name}</Link>
            )}
            
            {!item.isLast && (
              <span className="breadcrumb-separator">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;