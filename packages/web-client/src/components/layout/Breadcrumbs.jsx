/**
 * TerraFusionPro - Breadcrumbs Component
 * Displays the current navigation path to provide context
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = ({ currentPath }) => {
  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (path) => {
    const segments = path.split('/').filter(segment => segment);
    
    // Start with home
    const breadcrumbs = [
      { label: 'Home', path: '/' }
    ];
    
    // Build up paths for each segment
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += `/${segment}`;
      
      // Format segment name for display (capitalize, replace hyphens with spaces)
      let label = segment
        .replace(/-/g, ' ')
        .replace(/^\w|\s\w/g, match => match.toUpperCase());
      
      // Special cases for segment names
      if (segment === 'properties' && currentPath === '/properties') {
        label = 'Properties';
      } else if (segment === 'reports' && currentPath === '/reports') {
        label = 'Reports';
      } else if (segment === 'new') {
        if (currentPath.includes('properties')) {
          label = 'Add Property';
        } else if (currentPath.includes('reports')) {
          label = 'Create Report';
        }
      } else if (/^\d+$/.test(segment)) {
        // If segment is a number (ID), use a generic label
        if (currentPath.includes('properties')) {
          label = 'Property Details';
        } else if (currentPath.includes('reports')) {
          label = 'Report Details';
        }
      }
      
      breadcrumbs.push({ label, path: currentPath });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs(currentPath);
  
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={crumb.path} className="breadcrumb-item">
              {isLast ? (
                <span className="breadcrumb-current">{crumb.label}</span>
              ) : (
                <>
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                  <span className="breadcrumb-separator">›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;