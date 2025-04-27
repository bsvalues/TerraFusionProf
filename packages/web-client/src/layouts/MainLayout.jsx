/**
 * TerraFusionPro - Main Layout Component
 * Provides the primary layout structure for authenticated pages
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Components
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import NotificationCenter from '../components/layout/NotificationCenter';
import WorkflowProgress from '../components/layout/WorkflowProgress';

// Icons
import { 
  IconDashboard, 
  IconBuilding, 
  IconClipboard, 
  IconCamera, 
  IconChartLine, 
  IconUpload, 
  IconSync,
  IconSettings
} from '../components/icons';

/**
 * Main navigation items configuration
 */
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: IconDashboard,
  },
  {
    id: 'properties',
    label: 'Properties',
    path: '/properties',
    icon: IconBuilding,
    children: [
      { id: 'view-properties', label: 'View All', path: '/properties' },
      { id: 'add-property', label: 'Add New', path: '/properties/new' },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: IconClipboard,
    children: [
      { id: 'view-reports', label: 'View All', path: '/reports' },
      { id: 'create-report', label: 'Create New', path: '/reports/new' },
    ]
  },
  {
    id: 'field-data',
    label: 'Field Data',
    path: '/field-data',
    icon: IconCamera,
  },
  {
    id: 'market-analysis',
    label: 'Market Analysis',
    path: '/market-analysis',
    icon: IconChartLine,
  },
  {
    id: 'data-management',
    label: 'Data Management',
    icon: IconUpload,
    children: [
      { id: 'upload', label: 'Upload Files', path: '/upload' },
      { id: 'sync', label: 'Sync Data', path: '/sync' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: IconSettings,
  }
];

/**
 * MainLayout component 
 * Provides consistent layout with sidebar, header, and content area
 */
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Determine page title based on current route
  useEffect(() => {
    const path = location.pathname;
    let title = 'Dashboard';
    
    // Find matching navigation item for current path
    const findMatchingItem = (items) => {
      for (const item of items) {
        if (item.path === path) {
          title = item.label;
          return true;
        }
        if (item.children) {
          const found = findMatchingItem(item.children);
          if (found) return true;
        }
        
        // Handle dynamic routes with parameters
        if (item.path && path.startsWith(item.path + '/')) {
          title = item.label;
          return true;
        }
      }
      return false;
    };
    
    findMatchingItem(navigationItems);
    
    // Special handling for dynamic routes
    if (path.match(/^\/properties\/\d+$/)) {
      title = 'Property Details';
    } else if (path.match(/^\/reports\/\d+$/)) {
      title = 'Report Details';
    } else if (path === '/properties/new') {
      title = 'Add Property';
    } else if (path === '/reports/new') {
      title = 'Create Report';
    }
    
    setPageTitle(title);
    
    // Set active workflow based on path
    const getWorkflow = (path) => {
      if (path.startsWith('/properties')) {
        return {
          name: 'Property Management',
          steps: [
            { id: 'details', label: 'Property Details', path: '#details' },
            { id: 'location', label: 'Location', path: '#location' },
            { id: 'characteristics', label: 'Characteristics', path: '#characteristics' },
            { id: 'photos', label: 'Photos & Docs', path: '#photos' },
            { id: 'review', label: 'Review', path: '#review' }
          ],
          currentStep: path.includes('/new') ? 0 : 4
        };
      } else if (path.startsWith('/reports')) {
        return {
          name: 'Report Creation',
          steps: [
            { id: 'property', label: 'Select Property', path: '#property' },
            { id: 'inspection', label: 'Inspection Data', path: '#inspection' },
            { id: 'comps', label: 'Comparables', path: '#comps' },
            { id: 'valuation', label: 'Valuation', path: '#valuation' },
            { id: 'review', label: 'Review & Submit', path: '#review' }
          ],
          currentStep: path.includes('/new') ? 0 : 4
        };
      } else if (path.startsWith('/upload')) {
        return {
          name: 'Data Upload',
          steps: [
            { id: 'select', label: 'Select Files', path: '#select' },
            { id: 'validate', label: 'Validate', path: '#validate' },
            { id: 'map', label: 'Field Mapping', path: '#map' },
            { id: 'import', label: 'Import', path: '#import' }
          ],
          currentStep: 0
        };
      } else if (path.startsWith('/sync')) {
        return {
          name: 'Data Synchronization',
          steps: [
            { id: 'connect', label: 'Connect', path: '#connect' },
            { id: 'preview', label: 'Preview Changes', path: '#preview' },
            { id: 'resolve', label: 'Resolve Conflicts', path: '#resolve' },
            { id: 'confirm', label: 'Confirm Sync', path: '#confirm' }
          ],
          currentStep: 0
        };
      }
      
      return null;
    };
    
    setActiveWorkflow(getWorkflow(path));
    
  }, [location.pathname]);
  
  return (
    <div className={`app-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="layout-wrapper">
        <Sidebar 
          navigationItems={navigationItems}
          isOpen={sidebarOpen}
          isMobile={mobileMenuOpen}
          toggleSidebar={toggleSidebar}
          closeMobileMenu={() => setMobileMenuOpen(false)}
          currentPath={location.pathname}
        />
        
        <div className="layout-main">
          <Header 
            pageTitle={pageTitle}
            toggleSidebar={toggleSidebar}
            toggleMobileMenu={toggleMobileMenu}
            sidebarOpen={sidebarOpen}
            user={currentUser}
          />
          
          <main className="main-content">
            <div className="page-header-container">
              <Breadcrumbs currentPath={location.pathname} />
              
              {activeWorkflow && (
                <WorkflowProgress
                  workflow={activeWorkflow}
                  onStepClick={(step) => {
                    // Handle step navigation logic here
                    console.log('Navigate to step:', step);
                  }}
                />
              )}
            </div>
            
            <div className="page-content">
              <Outlet />
            </div>
          </main>
          
          <Footer />
        </div>
        
        <NotificationCenter />
      </div>
    </div>
  );
};

export default MainLayout;