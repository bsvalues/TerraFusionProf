import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Sample property data for demonstration purposes
const MOCK_PROPERTIES = [
  {
    id: 'prop-1001',
    address: '123 Main Street',
    city: 'Metropolis',
    state: 'NY',
    zipCode: '10001',
    type: 'Residential',
    subType: 'Single Family',
    status: 'Active',
    value: 450000,
    sqft: 2400,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: 1985,
    lastUpdated: '2023-04-20T14:30:00Z'
  },
  {
    id: 'prop-1002',
    address: '456 Oak Avenue',
    city: 'Urbanville',
    state: 'CA',
    zipCode: '90210',
    type: 'Commercial',
    subType: 'Office',
    status: 'Active',
    value: 1200000,
    sqft: 8500,
    bedrooms: null,
    bathrooms: 4,
    yearBuilt: 2002,
    lastUpdated: '2023-04-19T09:15:00Z'
  },
  {
    id: 'prop-1003',
    address: '789 Pine Lane',
    city: 'Ruraltown',
    state: 'TX',
    zipCode: '75001',
    type: 'Residential',
    subType: 'Multi-Family',
    status: 'Inactive',
    value: 550000,
    sqft: 3200,
    bedrooms: 6,
    bathrooms: 4,
    yearBuilt: 1975,
    lastUpdated: '2023-04-18T16:45:00Z'
  },
  {
    id: 'prop-1004',
    address: '101 Cedar Road',
    city: 'Lakeside',
    state: 'FL',
    zipCode: '33101',
    type: 'Mixed Use',
    subType: 'Retail/Residential',
    status: 'Active',
    value: 820000,
    sqft: 4800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1998,
    lastUpdated: '2023-04-15T11:30:00Z'
  },
  {
    id: 'prop-1005',
    address: '202 Maple Drive',
    city: 'Hamletville',
    state: 'IL',
    zipCode: '60601',
    type: 'Residential',
    subType: 'Condo',
    status: 'Pending',
    value: 325000,
    sqft: 1800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2010,
    lastUpdated: '2023-04-12T10:00:00Z'
  }
];

/**
 * Properties Component
 * Displays and manages property listings
 */
const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    type: '',
    status: '',
    valueMin: '',
    valueMax: ''
  });
  const [sortBy, setSortBy] = useState('address');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Load properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // In a real implementation, fetch data from API
        // For now, use the mock data with a timeout to simulate loading
        setTimeout(() => {
          setProperties(MOCK_PROPERTIES);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Format address
  const formatAddress = (property) => {
    return `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle sort column click
  const handleSortChange = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  // Toggle view mode between table and grid
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'table' ? 'grid' : 'table');
  };
  
  // Apply filters, sorting, and search to properties
  const filteredProperties = properties
    .filter(property => {
      // Apply search term
      const addressMatch = formatAddress(property).toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = property.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = !searchTerm || addressMatch || idMatch;
      
      // Apply filters
      const matchesType = !filter.type || property.type === filter.type;
      const matchesStatus = !filter.status || property.status === filter.status;
      
      // Apply value range filters
      const matchesMinValue = !filter.valueMin || property.value >= Number(filter.valueMin);
      const matchesMaxValue = !filter.valueMax || property.value <= Number(filter.valueMax);
      
      return matchesSearch && matchesType && matchesStatus && matchesMinValue && matchesMaxValue;
    })
    .sort((a, b) => {
      // Apply sorting
      let valueA, valueB;
      
      switch (sortBy) {
        case 'value':
          valueA = a.value;
          valueB = b.value;
          break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'lastUpdated':
          valueA = new Date(a.lastUpdated).getTime();
          valueB = new Date(b.lastUpdated).getTime();
          break;
        case 'address':
        default:
          valueA = formatAddress(a);
          valueB = formatAddress(b);
          break;
      }
      
      // Handle null/undefined values
      if (valueA === null || valueA === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (valueB === null || valueB === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      // Compare values based on sort order
      if (sortOrder === 'asc') {
        return typeof valueA === 'string' ? valueA.localeCompare(valueB) : valueA - valueB;
      } else {
        return typeof valueA === 'string' ? valueB.localeCompare(valueA) : valueB - valueA;
      }
    });
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }
  
  return (
    <div className="properties-page">
      <div className="page-header">
        <h1>Properties</h1>
        <div className="header-actions">
          <Link to="/properties/new" className="btn btn-primary">
            Add New Property
          </Link>
          <button className="btn btn-outline">
            Import Properties
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search properties by address or ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="form-control"
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="type">Property Type</label>
            <select
              id="type"
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed Use">Mixed Use</option>
              <option value="Industrial">Industrial</option>
              <option value="Land">Land</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="valueMin">Min Value</label>
            <input
              type="number"
              id="valueMin"
              name="valueMin"
              value={filter.valueMin}
              onChange={handleFilterChange}
              placeholder="Min $"
              className="form-control"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="valueMax">Max Value</label>
            <input
              type="number"
              id="valueMax"
              name="valueMax"
              value={filter.valueMax}
              onChange={handleFilterChange}
              placeholder="Max $"
              className="form-control"
            />
          </div>
          
          <button 
            className="btn btn-secondary"
            onClick={() => setFilter({
              type: '',
              status: '',
              valueMin: '',
              valueMax: ''
            })}
          >
            Clear Filters
          </button>
        </div>
        
        <div className="view-controls">
          <div className="results-count">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
          </div>
          
          <div className="view-mode-toggle">
            <button 
              className={`btn btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              🗃️
            </button>
            <button 
              className={`btn btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              📱
            </button>
          </div>
        </div>
      </div>
      
      {/* Properties View */}
      {viewMode === 'table' ? (
        /* Table View */
        <div className="properties-table-container">
          <table className="properties-table">
            <thead>
              <tr>
                <th 
                  className={sortBy === 'address' ? `sorted ${sortOrder}` : ''}
                  onClick={() => handleSortChange('address')}
                >
                  Address
                  {sortBy === 'address' && (
                    <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className={sortBy === 'type' ? `sorted ${sortOrder}` : ''}
                  onClick={() => handleSortChange('type')}
                >
                  Type
                  {sortBy === 'type' && (
                    <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className={sortBy === 'status' ? `sorted ${sortOrder}` : ''}
                  onClick={() => handleSortChange('status')}
                >
                  Status
                  {sortBy === 'status' && (
                    <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className={sortBy === 'value' ? `sorted ${sortOrder}` : ''}
                  onClick={() => handleSortChange('value')}
                >
                  Value
                  {sortBy === 'value' && (
                    <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>Details</th>
                <th 
                  className={sortBy === 'lastUpdated' ? `sorted ${sortOrder}` : ''}
                  onClick={() => handleSortChange('lastUpdated')}
                >
                  Last Updated
                  {sortBy === 'lastUpdated' && (
                    <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length > 0 ? (
                filteredProperties.map(property => (
                  <tr key={property.id}>
                    <td className="property-address">
                      <Link to={`/properties/${property.id}`}>
                        {formatAddress(property)}
                      </Link>
                    </td>
                    <td>{property.type} ({property.subType})</td>
                    <td>
                      <span className={`status-badge ${property.status.toLowerCase()}`}>
                        {property.status}
                      </span>
                    </td>
                    <td>{formatCurrency(property.value)}</td>
                    <td>
                      <span className="property-details">
                        {property.sqft} sqft
                        {property.bedrooms && `, ${property.bedrooms} bed`}
                        {property.bathrooms && `, ${property.bathrooms} bath`}
                      </span>
                    </td>
                    <td>{formatDate(property.lastUpdated)}</td>
                    <td className="actions-cell">
                      <Link to={`/properties/${property.id}`} className="btn btn-sm">
                        View
                      </Link>
                      <Link to={`/properties/${property.id}/edit`} className="btn btn-sm">
                        Edit
                      </Link>
                      <div className="dropdown">
                        <button className="btn btn-sm dropdown-toggle">
                          More
                        </button>
                        <div className="dropdown-menu">
                          <Link to={`/reports/new?propertyId=${property.id}`} className="dropdown-item">
                            Create Report
                          </Link>
                          <Link to={`/properties/${property.id}/history`} className="dropdown-item">
                            View History
                          </Link>
                          <button className="dropdown-item text-danger">
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    No properties found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="properties-grid">
          {filteredProperties.length > 0 ? (
            filteredProperties.map(property => (
              <div key={property.id} className="property-card">
                <div className="property-card-header">
                  <h3 className="property-title">
                    <Link to={`/properties/${property.id}`}>
                      {property.address}
                    </Link>
                  </h3>
                  <span className={`status-badge ${property.status.toLowerCase()}`}>
                    {property.status}
                  </span>
                </div>
                
                <div className="property-card-body">
                  <p className="property-location">
                    {property.city}, {property.state} {property.zipCode}
                  </p>
                  
                  <div className="property-details">
                    <div className="detail-item">
                      <span className="detail-label">Type</span>
                      <span className="detail-value">{property.type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Value</span>
                      <span className="detail-value">{formatCurrency(property.value)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Size</span>
                      <span className="detail-value">{property.sqft} sqft</span>
                    </div>
                    {property.bedrooms && (
                      <div className="detail-item">
                        <span className="detail-label">Beds</span>
                        <span className="detail-value">{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="detail-item">
                        <span className="detail-label">Baths</span>
                        <span className="detail-value">{property.bathrooms}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Year Built</span>
                      <span className="detail-value">{property.yearBuilt}</span>
                    </div>
                  </div>
                </div>
                
                <div className="property-card-footer">
                  <span className="updated-date">
                    Updated: {formatDate(property.lastUpdated)}
                  </span>
                  
                  <div className="property-actions">
                    <Link to={`/properties/${property.id}`} className="btn btn-sm">
                      View
                    </Link>
                    <Link to={`/properties/${property.id}/edit`} className="btn btn-sm">
                      Edit
                    </Link>
                    <div className="dropdown">
                      <button className="btn btn-sm dropdown-toggle">
                        More
                      </button>
                      <div className="dropdown-menu">
                        <Link to={`/reports/new?propertyId=${property.id}`} className="dropdown-item">
                          Create Report
                        </Link>
                        <Link to={`/properties/${property.id}/history`} className="dropdown-item">
                          View History
                        </Link>
                        <button className="dropdown-item text-danger">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No properties found matching your criteria</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilter({
                    type: '',
                    status: '',
                    valueMin: '',
                    valueMax: ''
                  });
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Pagination */}
      {filteredProperties.length > 0 && (
        <div className="pagination">
          <button className="btn btn-sm" disabled>
            Previous
          </button>
          
          <div className="page-numbers">
            <button className="page-number active">1</button>
            <button className="page-number">2</button>
            <button className="page-number">3</button>
          </div>
          
          <button className="btn btn-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Properties;