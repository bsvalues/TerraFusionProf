/**
 * TerraFusionPro Web Client - Property Detail Component
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// API Base URL
const API_BASE_URL = '/api';

const PropertyDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchPropertyData = async () => {
      try {
        // Fetch property details
        const propertyResponse = await fetch(`${API_BASE_URL}/properties/${id}`);
        
        if (!propertyResponse.ok) {
          throw new Error('Failed to fetch property details');
        }
        
        const propertyData = await propertyResponse.json();
        setProperty(propertyData.property);
        
        // Fetch related reports
        const reportsResponse = await fetch(`${API_BASE_URL}/reports?property_id=${id}`);
        
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData.reports || []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching property details:', error);
        setError('Failed to load property details');
        setLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading property details...</h2>
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
        <Link to="/properties" className="btn btn-primary">Back to Properties</Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container">
        <h1>Property Not Found</h1>
        <p>The property you are looking for does not exist or has been removed.</p>
        <Link to="/properties" className="btn btn-primary">Back to Properties</Link>
      </div>
    );
  }

  // Format features as list if it's a string
  let featuresList = [];
  if (property.features) {
    if (typeof property.features === 'string') {
      try {
        featuresList = JSON.parse(property.features);
      } catch {
        featuresList = property.features.split(',').map(item => item.trim());
      }
    } else if (Array.isArray(property.features)) {
      featuresList = property.features;
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/properties" className="btn btn-outline">
          ← Back to Properties
        </Link>
      </div>
      
      <div className="property-detail">
        <div className="property-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1>{property.address}</h1>
            <p className="property-location">{property.city}, {property.state} {property.zip_code}</p>
          </div>
          <div>
            <Link to={`/properties/${id}/edit`} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
              Edit Property
            </Link>
            <Link to={`/reports/new?property_id=${id}`} className="btn btn-secondary">
              Create Report
            </Link>
          </div>
        </div>
        
        <div className="property-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="card">
            <h2>Property Details</h2>
            <div className="property-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <p><strong>Type:</strong> {property.property_type?.replace('_', ' ')}</p>
                <p><strong>Year Built:</strong> {property.year_built || 'N/A'}</p>
                <p><strong>Building Size:</strong> {property.building_size || 'N/A'}</p>
                <p><strong>Lot Size:</strong> {property.lot_size || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Bedrooms:</strong> {property.bedrooms || 'N/A'}</p>
                <p><strong>Bathrooms:</strong> {property.bathrooms || 'N/A'}</p>
                <p><strong>County:</strong> {property.county || 'N/A'}</p>
                <p><strong>Zoning:</strong> {property.zoned_as || 'N/A'}</p>
              </div>
            </div>
            
            <h3 style={{ marginTop: '1.5rem' }}>Description</h3>
            <p>{property.description || 'No description available.'}</p>
            
            {featuresList.length > 0 && (
              <>
                <h3 style={{ marginTop: '1.5rem' }}>Features</h3>
                <ul>
                  {featuresList.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          
          <div>
            <div className="card">
              <h2>Location</h2>
              {property.latitude && property.longitude ? (
                <div style={{ width: '100%', height: '200px', background: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem', borderRadius: '0.5rem' }}>
                  <p>Map visualization will be implemented soon</p>
                </div>
              ) : (
                <p>No location coordinates available for this property.</p>
              )}
            </div>
            
            <div className="card">
              <h2>Property Images</h2>
              {property.images && property.images.length > 0 ? (
                <div className="property-images">
                  {property.images.map(image => (
                    <div key={image.id} className="property-image">
                      <img src={image.url} alt={image.caption || 'Property image'} />
                      {image.caption && <p>{image.caption}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No images available for this property.</p>
              )}
              <div style={{ marginTop: '1rem' }}>
                <Link to={`/properties/${id}/images/add`} className="btn btn-primary">Add Images</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Related Reports</h2>
            <Link to={`/reports/new?property_id=${id}`} className="btn btn-primary">Create New Report</Link>
          </div>
          
          {reports.length > 0 ? (
            <div className="reports-grid" style={{ marginTop: '1rem' }}>
              {reports.map(report => (
                <div key={report.id} className="card">
                  <h3>{report.title || `Report #${report.report_number}`}</h3>
                  <p><strong>Report Number:</strong> {report.report_number}</p>
                  <p><strong>Status:</strong> {report.status?.replace('_', ' ')}</p>
                  <p><strong>Date:</strong> {new Date(report.created_at).toLocaleDateString()}</p>
                  <Link to={`/reports/${report.id}`} className="btn btn-primary">View Report</Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No reports available for this property.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;