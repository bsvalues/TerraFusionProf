/**
 * TerraFusionPro Web Client - Main App Component
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

// Properties Component (will be moved to its own file later)
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// API Base URL
const API_BASE_URL = '/api';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Properties Component
const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchProperties = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/properties`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch properties');
          }
          
          const data = await response.json();
          setProperties(data.properties || []);
        } catch (error) {
          console.error('Error fetching properties:', error);
          setError('Failed to load properties');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProperties();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>Access Restricted</h1>
        <p>Please log in to view properties.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  if (loading) {
    return <div>Loading properties...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Properties</h1>
        <Link to="/properties/new" className="btn btn-primary">Add New Property</Link>
      </div>
      
      <div className="property-grid">
        {properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          properties.map(property => (
            <div key={property.id} className="card">
              <h2>{property.address}</h2>
              <p>{property.city}, {property.state} {property.zip_code}</p>
              <p><strong>Type:</strong> {property.property_type}</p>
              <p><strong>Size:</strong> {property.building_size}</p>
              {property.year_built && <p><strong>Built:</strong> {property.year_built}</p>}
              <Link to={`/properties/${property.id}`} className="btn btn-primary">View Details</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Reports Component
const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchReports = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/reports`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch reports');
          }
          
          const data = await response.json();
          setReports(data.reports || []);
        } catch (error) {
          console.error('Error fetching reports:', error);
          setError('Failed to load reports');
        } finally {
          setLoading(false);
        }
      };
      
      fetchReports();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>Access Restricted</h1>
        <p>Please log in to view reports.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Group reports by status
  const reportsByStatus = {
    draft: reports.filter(r => r.status === 'draft'),
    pending_review: reports.filter(r => r.status === 'pending_review'),
    in_review: reports.filter(r => r.status === 'in_review'),
    approved: reports.filter(r => r.status === 'approved'),
    finalized: reports.filter(r => r.status === 'finalized'),
    archived: reports.filter(r => r.status === 'archived')
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Appraisal Reports</h1>
        <Link to="/reports/new" className="btn btn-primary">Create New Report</Link>
      </div>
      
      <div className="reports-container">
        {reports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <>
            {Object.entries(reportsByStatus).map(([status, statusReports]) => (
              statusReports.length > 0 && (
                <div key={status} className="reports-section">
                  <h2>{status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</h2>
                  <div className="reports-grid">
                    {statusReports.map(report => (
                      <div key={report.id} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className={`status-badge ${getStatusClass(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3>{report.title || `Report #${report.report_number}`}</h3>
                        <p><strong>Report Number:</strong> {report.report_number}</p>
                        <p><strong>Client:</strong> {report.client_name}</p>
                        <p><strong>Date:</strong> {formatDate(report.created_at)}</p>
                        <Link to={`/reports/${report.id}`} className="btn btn-primary">View Report</Link>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// Analysis Component
const Analysis = () => {
  return (
    <div className="container">
      <h1>Market Analysis</h1>
      <p>This section provides access to market analytics, property valuation tools, and comparable analysis.</p>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2>Market Data</h2>
          <p>View market trends, property value indices, and sales data.</p>
          <Link to="/analysis/market" className="btn btn-primary">Explore Market Data</Link>
        </div>
        
        <div className="card">
          <h2>Comparable Analysis</h2>
          <p>Find and analyze comparable properties for accurate valuations.</p>
          <Link to="/analysis/comps" className="btn btn-primary">Comparable Tool</Link>
        </div>
        
        <div className="card">
          <h2>Valuation Models</h2>
          <p>Access automated valuation models and price prediction tools.</p>
          <Link to="/analysis/valuation" className="btn btn-primary">Valuation Tools</Link>
        </div>
      </div>
    </div>
  );
};

// Account Component
const Account = () => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>Access Restricted</h1>
        <p>Please log in to view your account.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Your Account</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2>Profile Information</h2>
          <p><strong>Name:</strong> {currentUser.first_name} {currentUser.last_name}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Role:</strong> {currentUser.role}</p>
          {currentUser.company && <p><strong>Company:</strong> {currentUser.company}</p>}
          <button className="btn btn-primary">Edit Profile</button>
        </div>
        
        <div className="card">
          <h2>Security</h2>
          <p>Update your password and security settings.</p>
          <button className="btn btn-primary">Change Password</button>
        </div>
        
        <div className="card">
          <h2>Preferences</h2>
          <p>Manage your notification and display preferences.</p>
          <button className="btn btn-primary">Edit Preferences</button>
        </div>
      </div>
    </div>
  );
};

// Not Found Component
const NotFound = () => (
  <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
  </div>
);

// Main App Component
const App = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/properties" element={
            <PrivateRoute>
              <Properties />
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          } />
          <Route path="/analysis" element={
            <PrivateRoute>
              <Analysis />
            </PrivateRoute>
          } />
          <Route path="/account" element={
            <PrivateRoute>
              <Account />
            </PrivateRoute>
          } />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;