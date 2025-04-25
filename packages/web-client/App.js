/**
 * TerraFusionPro Web Client - Main App Component
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { useAuth } from './contexts/AuthContext';

// API Base URL
const API_BASE_URL = '/api';

// Dashboard Component
const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>Welcome to TerraFusionPro</h1>
        <p>Please log in to access the dashboard.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard">
        <div className="card">
          <h2>Recent Properties</h2>
          <p>You have {properties.length} properties in your portfolio.</p>
          <Link to="/properties" className="btn btn-primary">View All</Link>
        </div>
        
        <div className="card">
          <h2>Appraisal Reports</h2>
          <p>{reports.filter(r => r.status === 'pending_review' || r.status === 'in_review').length} reports need your attention.</p>
          <Link to="/reports" className="btn btn-primary">View Reports</Link>
        </div>
        
        <div className="card">
          <h2>Market Insights</h2>
          <p>Access market analysis and property valuations.</p>
          <Link to="/analysis" className="btn btn-primary">View Analysis</Link>
        </div>
        
        <div className="card">
          <h2>Field Collection</h2>
          <p>Manage property inspections and data collection.</p>
          <Link to="/fieldwork" className="btn btn-primary">Field App</Link>
        </div>
      </div>
    </div>
  );
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
      <h1>Properties</h1>
      
      <div className="property-list">
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
      <h1>Appraisal Reports</h1>
      
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
                      <div key={report.id} className={`card ${getStatusClass(report.status)}`}>
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
      
      <div className="analysis-grid">
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
      
      <div className="account-profile">
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
      </div>
    </div>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="auth-footer">
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};

// Not Found Component
const NotFound = () => (
  <div className="container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
  </div>
);

// Import necessary router components
import { useNavigate } from 'react-router-dom';

const App = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;