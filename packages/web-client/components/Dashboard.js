/**
 * TerraFusionPro Web Client - Dashboard Component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// API Base URL
const API_BASE_URL = '/api';

const Dashboard = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [recentProperties, setRecentProperties] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [activeReports, setActiveReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        // Fetch recent properties
        const propertiesResponse = await fetch(`${API_BASE_URL}/properties?limit=5&sort=created_at&order=desc`);
        
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json();
          setRecentProperties(propertiesData.properties || []);
        }
        
        // Fetch pending reports
        const pendingResponse = await fetch(`${API_BASE_URL}/reports?status=pending_review,in_review&limit=5`);
        
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingReports(pendingData.reports || []);
        }
        
        // Fetch active reports (draft or active)
        const activeResponse = await fetch(`${API_BASE_URL}/reports?status=draft&limit=5`);
        
        if (activeResponse.ok) {
          const activeData = await activeResponse.json();
          setActiveReports(activeData.reports || []);
        }
        
        // Fetch statistics
        const statsResponse = await fetch(`${API_BASE_URL}/statistics`);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStatistics(statsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading dashboard...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message" style={{ padding: '2rem', backgroundColor: '#fff0f0', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'draft': return 'status-draft';
      case 'pending_review': return 'status-pending';
      case 'in_review': return 'status-review';
      case 'approved': return 'status-approved';
      case 'finalized': return 'status-finalized';
      case 'archived': return 'status-archived';
      default: return '';
    }
  };

  return (
    <div className="container dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <div>
          <Link to="/properties/new" className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
            Add Property
          </Link>
          <Link to="/reports/new" className="btn btn-secondary">
            Create Report
          </Link>
        </div>
      </div>
      
      {/* Statistics Overview */}
      <div className="stats-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3>Properties</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#2563eb' }}>
            {statistics?.propertyCount || '0'}
          </div>
          <p>Total properties</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3>Reports</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#2563eb' }}>
            {statistics?.reportCount || '0'}
          </div>
          <p>Total reports</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3>Pending Review</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#f59e0b' }}>
            {statistics?.pendingReviewCount || '0'}
          </div>
          <p>Awaiting review</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3>Completed</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#10b981' }}>
            {statistics?.completedCount || '0'}
          </div>
          <p>Finalized reports</p>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="activity-section" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Recent Activity</h2>
            <Link to="/reports" className="btn btn-text">View All Reports</Link>
          </div>
          
          <div className="tabs" style={{ marginBottom: '1.5rem' }}>
            <button className="tab active">All</button>
            <button className="tab">Requires Attention</button>
            <button className="tab">Recently Updated</button>
          </div>
          
          {pendingReports.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Report</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Property</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingReports.map(report => (
                  <tr key={report.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <Link to={`/reports/${report.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                        {report.title || `Report #${report.report_number}`}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {report.property ? (
                        <Link to={`/properties/${report.property_id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {report.property.address}
                        </Link>
                      ) : (
                        <span>Unknown Property</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`status-badge ${getStatusClass(report.status)}`}>
                        {report.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{formatDate(report.updated_at || report.created_at)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <Link to={`/reports/${report.id}`} className="btn btn-sm btn-primary">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No pending reports at this time.</p>
          )}
        </div>
      </div>
      
      {/* Recent Properties */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Recent Properties</h2>
        <Link to="/properties" className="btn btn-text">View All Properties</Link>
      </div>
      
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {recentProperties.length > 0 ? (
          recentProperties.map(property => (
            <div key={property.id} className="card" style={{ position: 'relative' }}>
              <h3>{property.address}</h3>
              <p>{property.city}, {property.state} {property.zip_code}</p>
              
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <p><strong>Type:</strong> {property.property_type?.replace('_', ' ') || 'N/A'}</p>
                {property.building_size && (
                  <p><strong>Size:</strong> {property.building_size}</p>
                )}
                {property.year_built && (
                  <p><strong>Year Built:</strong> {property.year_built}</p>
                )}
              </div>
              
              <Link to={`/properties/${property.id}`} className="btn btn-primary">View Details</Link>
              <Link to={`/reports/new?property_id=${property.id}`} className="btn btn-outline" style={{ marginLeft: '0.5rem' }}>
                Create Report
              </Link>
            </div>
          ))
        ) : (
          <div className="card">
            <h3>No Properties Found</h3>
            <p>You haven't added any properties yet.</p>
            <Link to="/properties/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add Property</Link>
          </div>
        )}
      </div>
      
      {/* Your Reports */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem' }}>
        <h2>Your Draft Reports</h2>
        <Link to="/reports?status=draft" className="btn btn-text">View All Drafts</Link>
      </div>
      
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {activeReports.length > 0 ? (
          activeReports.map(report => (
            <div key={report.id} className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <span className={`status-badge ${getStatusClass(report.status)}`}>
                  {report.status?.replace('_', ' ')}
                </span>
              </div>
              
              <h3>{report.title || `Report #${report.report_number}`}</h3>
              <p><strong>Report #:</strong> {report.report_number}</p>
              
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <p><strong>Client:</strong> {report.client_name || 'N/A'}</p>
                <p><strong>Created:</strong> {formatDate(report.created_at)}</p>
                <p><strong>Updated:</strong> {formatDate(report.updated_at || report.created_at)}</p>
              </div>
              
              <Link to={`/reports/${report.id}`} className="btn btn-primary">Continue Editing</Link>
            </div>
          ))
        ) : (
          <div className="card">
            <h3>No Draft Reports</h3>
            <p>You don't have any reports in draft status.</p>
            <Link to="/reports/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create New Report</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;