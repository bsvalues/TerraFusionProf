/**
 * TerraFusionPro Web Client - Report Detail Component
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// API Base URL
const API_BASE_URL = '/api';

const ReportDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [report, setReport] = useState(null);
  const [property, setProperty] = useState(null);
  const [comparables, setComparables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchReportData = async () => {
      try {
        // Fetch report details
        const reportResponse = await fetch(`${API_BASE_URL}/reports/${id}`);
        
        if (!reportResponse.ok) {
          throw new Error('Failed to fetch report details');
        }
        
        const reportData = await reportResponse.json();
        setReport(reportData.report);
        
        if (reportData.report.property) {
          setProperty(reportData.report.property);
        }
        
        if (reportData.report.comparables) {
          setComparables(reportData.report.comparables);
        } else {
          // Fetch comparables separately if not included in report data
          const comparablesResponse = await fetch(`${API_BASE_URL}/reports/${id}/comparables`);
          
          if (comparablesResponse.ok) {
            const comparablesData = await comparablesResponse.json();
            setComparables(comparablesData.comparables || []);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching report details:', error);
        setError('Failed to load report details');
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [id, isAuthenticated, navigate]);

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          userRole: currentUser.role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report status');
      }
      
      const updatedReport = await response.json();
      setReport(updatedReport.report);
      
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading report details...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          {error}
        </div>
        <Link to="/reports" className="btn btn-primary">Back to Reports</Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container">
        <h1>Report Not Found</h1>
        <p>The report you are looking for does not exist or has been removed.</p>
        <Link to="/reports" className="btn btn-primary">Back to Reports</Link>
      </div>
    );
  }

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  // Determine available status actions based on current status and user role
  const getAvailableStatusActions = () => {
    const actions = [];
    
    if (currentUser.role === 'admin') {
      // Admins can set any status
      if (report.status !== 'draft') actions.push({ status: 'draft', label: 'Set as Draft' });
      if (report.status !== 'pending_review') actions.push({ status: 'pending_review', label: 'Submit for Review' });
      if (report.status !== 'in_review') actions.push({ status: 'in_review', label: 'Start Review' });
      if (report.status !== 'approved') actions.push({ status: 'approved', label: 'Approve Report' });
      if (report.status !== 'finalized') actions.push({ status: 'finalized', label: 'Finalize Report' });
      if (report.status !== 'archived') actions.push({ status: 'archived', label: 'Archive Report' });
    } else if (currentUser.role === 'appraiser') {
      // Appraisers can draft and submit
      if (report.status === 'draft') {
        actions.push({ status: 'pending_review', label: 'Submit for Review' });
      }
      if (report.status === 'pending_review') {
        actions.push({ status: 'draft', label: 'Return to Draft' });
      }
    } else if (currentUser.role === 'reviewer') {
      // Reviewers can review, approve, or return to pending
      if (report.status === 'pending_review') {
        actions.push({ status: 'in_review', label: 'Start Review' });
      }
      if (report.status === 'in_review') {
        actions.push({ 
          status: 'pending_review', 
          label: 'Return for Revision' 
        });
        actions.push({ 
          status: 'approved', 
          label: 'Approve Report' 
        });
      }
      if (report.status === 'approved') {
        actions.push({ 
          status: 'in_review', 
          label: 'Return to Review' 
        });
        actions.push({ 
          status: 'finalized', 
          label: 'Finalize Report' 
        });
      }
    }
    
    return actions;
  };

  const statusActions = getAvailableStatusActions();

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/reports" className="btn btn-outline">
          ← Back to Reports
        </Link>
      </div>
      
      <div className="report-detail">
        <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1>{report.title || `Report #${report.report_number}`}</h1>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
              <span className={`status-badge ${getStatusClass(report.status)}`}>
                {report.status?.replace('_', ' ')}
              </span>
              <span style={{ marginLeft: '1rem' }}>Report Number: {report.report_number}</span>
            </div>
          </div>
          <div>
            <Link to={`/reports/${id}/edit`} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
              Edit Report
            </Link>
            <Link to={`/reports/${id}/pdf`} className="btn btn-secondary">
              Export PDF
            </Link>
          </div>
        </div>
        
        {statusActions.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Report Actions</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {statusActions.map(action => (
                <button 
                  key={action.status}
                  className="btn btn-primary"
                  onClick={() => handleStatusChange(action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Report Information</h2>
                <button 
                  className="btn btn-text"
                  onClick={() => setExpandedSection(expandedSection === 'info' ? null : 'info')}
                >
                  {expandedSection === 'info' ? 'Collapse' : 'Expand'}
                </button>
              </div>
              
              {(expandedSection === 'info' || expandedSection === null) && (
                <div className="report-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <p><strong>Client:</strong> {report.client_name || 'N/A'}</p>
                    <p><strong>Client Email:</strong> {report.client_email || 'N/A'}</p>
                    <p><strong>Client Phone:</strong> {report.client_phone || 'N/A'}</p>
                    <p><strong>Appraisal Date:</strong> {formatDate(report.appraisal_date)}</p>
                  </div>
                  <div>
                    <p><strong>Effective Date:</strong> {formatDate(report.effective_date)}</p>
                    <p><strong>Appraiser:</strong> {report.appraiser ? `${report.appraiser.first_name} ${report.appraiser.last_name}` : 'N/A'}</p>
                    <p><strong>Reviewer:</strong> {report.reviewer ? `${report.reviewer.first_name} ${report.reviewer.last_name}` : 'N/A'}</p>
                    <p><strong>Created:</strong> {formatDate(report.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Valuation</h2>
                <button 
                  className="btn btn-text"
                  onClick={() => setExpandedSection(expandedSection === 'valuation' ? null : 'valuation')}
                >
                  {expandedSection === 'valuation' ? 'Collapse' : 'Expand'}
                </button>
              </div>
              
              {(expandedSection === 'valuation' || expandedSection === null) && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="valuation-summary" style={{ 
                    backgroundColor: '#f3f4f6', 
                    padding: '1.5rem', 
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{ color: '#1e40af' }}>Final Valuation</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                      {formatCurrency(report.valuation)}
                    </div>
                    {report.value_per_sqft && property && property.building_size && (
                      <div>
                        {formatCurrency(report.value_per_sqft)} per {property.building_size.includes('sqft') ? 'square foot' : 'unit'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3>Valuation Approach</h3>
                    <p>{report.methodology || 'No methodology specified'}</p>
                    
                    <h3 style={{ marginTop: '1.5rem' }}>Conclusions</h3>
                    <p>{report.conclusions || 'No conclusions specified'}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Comparable Properties</h2>
                <div>
                  <button 
                    className="btn btn-text"
                    onClick={() => setExpandedSection(expandedSection === 'comparables' ? null : 'comparables')}
                    style={{ marginRight: '0.5rem' }}
                  >
                    {expandedSection === 'comparables' ? 'Collapse' : 'Expand'}
                  </button>
                  <Link to={`/reports/${id}/comparables/add`} className="btn btn-primary">Add Comparable</Link>
                </div>
              </div>
              
              {(expandedSection === 'comparables' || expandedSection === null) && (
                <div style={{ marginTop: '1rem' }}>
                  {comparables.length > 0 ? (
                    <div className="comparables-list">
                      {comparables.map((comp, index) => (
                        <div key={comp.id || index} className="comparable-item" style={{ 
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem',
                          padding: '1rem'
                        }}>
                          <h3>{comp.address}</h3>
                          <p>{comp.city}, {comp.state} {comp.zip_code}</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                              <p><strong>Sale Price:</strong> {formatCurrency(comp.sale_price)}</p>
                              <p><strong>Sale Date:</strong> {formatDate(comp.sale_date)}</p>
                              <p><strong>Property Type:</strong> {comp.property_type?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                              <p><strong>Building Size:</strong> {comp.building_size || 'N/A'}</p>
                              <p><strong>Year Built:</strong> {comp.year_built || 'N/A'}</p>
                              <p><strong>Distance:</strong> {comp.distance_in_miles ? `${comp.distance_in_miles} miles` : 'N/A'}</p>
                            </div>
                            <div>
                              <p><strong>Adjusted Price:</strong> {formatCurrency(comp.adjusted_price)}</p>
                              <p><strong>Similarity Score:</strong> {comp.similarity_score ? `${comp.similarity_score}%` : 'N/A'}</p>
                            </div>
                          </div>
                          
                          {comp.description && (
                            <div style={{ marginTop: '1rem' }}>
                              <p><strong>Notes:</strong> {comp.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No comparable properties added to this report yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="card">
              <h2>Property Information</h2>
              {property ? (
                <div style={{ marginTop: '1rem' }}>
                  <h3>{property.address}</h3>
                  <p>{property.city}, {property.state} {property.zip_code}</p>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <p><strong>Type:</strong> {property.property_type?.replace('_', ' ') || 'N/A'}</p>
                    <p><strong>Size:</strong> {property.building_size || 'N/A'}</p>
                    <p><strong>Year Built:</strong> {property.year_built || 'N/A'}</p>
                    <p><strong>Beds/Baths:</strong> {property.bedrooms || 'N/A'} / {property.bathrooms || 'N/A'}</p>
                  </div>
                  
                  <Link to={`/properties/${property.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    View Full Property Details
                  </Link>
                </div>
              ) : (
                <p>Property information not available</p>
              )}
            </div>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2>Revision History</h2>
              <p style={{ marginTop: '1rem' }}>
                <strong>Current Version:</strong> {report.version || '1'}
              </p>
              <p>
                <strong>Last Updated:</strong> {formatDate(report.updated_at)}
              </p>
              
              {report.submitted_at && (
                <p><strong>Submitted:</strong> {formatDate(report.submitted_at)}</p>
              )}
              
              {report.approved_at && (
                <p><strong>Approved:</strong> {formatDate(report.approved_at)}</p>
              )}
              
              {report.finalized_at && (
                <p><strong>Finalized:</strong> {formatDate(report.finalized_at)}</p>
              )}
              
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/reports/${id}/history`} className="btn btn-outline">View Full History</Link>
              </div>
            </div>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2>Document Attachments</h2>
              <p style={{ marginTop: '1rem' }}>No documents attached to this report.</p>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary">Add Document</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;