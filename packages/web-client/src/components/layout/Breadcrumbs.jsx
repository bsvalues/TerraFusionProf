/**
 * TerraFusionPro - Breadcrumbs Component
 * Displays hierarchical navigation path for current page
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Breadcrumbs Component
 * @param {Object} props - Component props
 * @param {Object} props.routeMapping - Custom mapping of routes to breadcrumb labels
 * @param {Object} props.dynamicSegments - Object of dynamic segment values (e.g., { id: 'Property Name' })
 * @param {boolean} props.showHomeIcon - Whether to show home icon for first item
 */
const Breadcrumbs = ({
  routeMapping = {},
  dynamicSegments = {},
  showHomeIcon = true
}) => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  useEffect(() => {
    // Generate breadcrumbs based on current location
    const generateBreadcrumbs = () => {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      
      // Start with home
      const crumbs = [
        {
          label: 'Home',
          path: '/',
          isLast: pathSegments.length === 0
        }
      ];
      
      // Build up the breadcrumbs for each path segment
      let currentPath = '';
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        // Check if this segment is a dynamic parameter (e.g., :id)
        const isDynamicSegment = segment.match(/^[0-9a-f]{8,}$/i);
        const isLastSegment = index === pathSegments.length - 1;
        
        let label;
        
        // Try to find a specific mapping for this path
        if (routeMapping[currentPath]) {
          label = routeMapping[currentPath];
        } 
        // Use the dynamic segment label if this appears to be a parameter
        else if (isDynamicSegment && dynamicSegments[segment]) {
          label = dynamicSegments[segment];
        }
        // Default to formatted segment name
        else {
          label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        
        crumbs.push({
          label,
          path: currentPath,
          isLast: isLastSegment
        });
      });
      
      return crumbs;
    };
    
    setBreadcrumbs(generateBreadcrumbs());
  }, [location, routeMapping, dynamicSegments]);
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }
  
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => (
          <li 
            key={crumb.path} 
            className={`breadcrumb-item ${crumb.isLast ? 'active' : ''}`}
          >
            {index === 0 && showHomeIcon ? (
              <Link to={crumb.path} aria-label="Home">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </Link>
            ) : crumb.isLast ? (
              <span>{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
            
            {!crumb.isLast && (
              <span className="breadcrumb-separator">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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