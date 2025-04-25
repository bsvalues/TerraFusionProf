/**
 * TerraFusionPro Web Client - Dashboard Component
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// API Base URL
const API_BASE_URL = '/api';

// Dashboard Card Component
const DashboardCard = ({ title, count, description, linkTo, linkText, icon }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2>{title}</h2>
        {icon && <div className="card-icon">{icon}</div>}
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>{count}</p>
      <p>{description}</p>
      <Link to={linkTo} className="btn btn-primary">{linkText}</Link>
    </div>
  );
};

// Chart Placeholder Component
const ChartPlaceholder = ({ title, description }) => {
  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <h2>{title}</h2>
      <div 
        style={{ 
          height: '220px', 
          background: 'linear-gradient(to right, #e5e7eb, #f3f4f6, #e5e7eb)',
          borderRadius: '0.5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <span>Chart visualization will be implemented soon</span>
      </div>
      <p>{description}</p>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ activities }) => {
  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <h2>Recent Activity</h2>
      {activities.length === 0 ? (
        <p>No recent activities found.</p>
      ) : (
        <div>
          {activities.map((activity, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '0.75rem 0',
                borderBottom: index < activities.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{activity.description}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchDashboardData = async () => {
        try {
          // Fetch properties
          const propertiesResponse = await fetch(`${API_BASE_URL}/properties`);
          const propertiesData = await propertiesResponse.json();
          
          // Fetch reports
          const reportsResponse = await fetch(`${API_BASE_URL}/reports`);
          const reportsData = await reportsResponse.json();
          
          setProperties(propertiesData.properties || []);
          setReports(reportsData.reports || []);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setError('Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // If not authenticated
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>Welcome to TerraFusionPro</h1>
        <p>Please log in to access your dashboard.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard data...</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="error-message" style={{ margin: '2rem' }}>
        {error}
      </div>
    );
  }

  // Calculate counts for different statuses
  const pendingReviews = reports.filter(r => r.status === 'pending_review' || r.status === 'in_review').length;
  const draftReports = reports.filter(r => r.status === 'draft').length;
  const finalizedReports = reports.filter(r => r.status === 'finalized').length;
  
  // Get property types
  const residentialProperties = properties.filter(p => p.property_type === 'residential').length;
  const commercialProperties = properties.filter(p => p.property_type === 'commercial').length;
  
  // Sample recent activities (would be fetched from an API in a real implementation)
  const recentActivities = [
    { description: 'New property added: 123 Main St', time: '30 minutes ago' },
    { description: 'Report #RA-2025-001 submitted for review', time: '2 hours ago' },
    { description: 'Property inspection scheduled for 456 Market St', time: '4 hours ago' },
    { description: 'Comparable analysis completed for 789 Oak Ave', time: '1 day ago' },
  ];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>Welcome, {currentUser.first_name} {currentUser.last_name}</span>
          <Link to="/properties/new" className="btn btn-primary">Add New Property</Link>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <DashboardCard 
          title="Properties" 
          count={properties.length} 
          description="Total properties in your portfolio"
          linkTo="/properties"
          linkText="View All Properties"
        />
        
        <DashboardCard 
          title="Reports" 
          count={reports.length} 
          description="Total appraisal reports"
          linkTo="/reports"
          linkText="View All Reports"
        />
        
        <DashboardCard 
          title="Pending Reviews" 
          count={pendingReviews} 
          description="Reports waiting for review"
          linkTo="/reports?status=pending_review"
          linkText="View Pending Reviews"
        />
        
        <DashboardCard 
          title="Draft Reports" 
          count={draftReports} 
          description="Reports in progress"
          linkTo="/reports?status=draft"
          linkText="View Drafts"
        />
        
        <ChartPlaceholder 
          title="Property Distribution" 
          description={`Your portfolio contains ${residentialProperties} residential and ${commercialProperties} commercial properties.`} 
        />
        
        <ChartPlaceholder 
          title="Report Completion" 
          description={`You have ${finalizedReports} finalized reports and ${draftReports + pendingReviews} in progress.`} 
        />
        
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
};

export default Dashboard;