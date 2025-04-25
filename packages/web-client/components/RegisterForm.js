/**
 * TerraFusionPro Web Client - Register Form Component
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// API Base URL
const API_BASE_URL = '/api';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    company: '',
    role: 'appraiser', // Default role
    terms_accepted: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const validateForm = () => {
    // Check required fields
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError('Please fill out all required fields');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Check password match
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return false;
    }
    
    // Ensure terms are accepted
    if (!formData.terms_accepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate form inputs
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Send registration request to the API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          company: formData.company,
          role: formData.role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const userData = await response.json();
      
      // Set success state
      setSuccess(true);
      
      // Automatically log the user in
      await login(formData.email, formData.password);
      
      // Redirect to dashboard with a slight delay to show success message
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check for known error types
      if (error.message.includes('email already exists')) {
        setError('An account with this email address already exists');
      } else {
        setError(error.message || 'Failed to register. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Show success message if registration was successful
  if (success) {
    return (
      <div className="auth-container">
        <div className="card" style={{ padding: '2rem', maxWidth: '450px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#047857', fontSize: '3rem', marginBottom: '1rem' }}>
            ✓
          </div>
          <h1 style={{ color: '#047857', marginBottom: '1rem' }}>Registration Successful!</h1>
          <p style={{ marginBottom: '2rem' }}>Your account has been created successfully. You will be redirected to the dashboard shortly.</p>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auth-container">
      <div className="card" style={{ padding: '2rem', maxWidth: '550px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <svg width="120" height="30" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path d="M45 15L30 5L15 15V35L30 45L45 35V15Z" fill="#2563EB"/>
              <path d="M30 5L15 15V35L30 45V25L45 15V35L30 45L45 35V15L30 5Z" fill="#1E40AF"/>
              <path d="M30 5V25L15 15L30 5Z" fill="#60A5FA"/>
              <path d="M30 25L30 45L15 35V15L30 25Z" fill="#3B82F6"/>
            </g>
            <text x="60" y="35" fill="#2563EB" fontSize="24" fontWeight="bold">TerraFusionPro</text>
          </svg>
        </div>
        
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1e40af' }}>Create an Account</h1>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem' 
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="first_name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                First Name *
              </label>
              <input 
                type="text" 
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-control"
                style={{
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Last Name *
              </label>
              <input 
                type="text" 
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="form-control"
                style={{
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email Address *
            </label>
            <input 
              type="email" 
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              style={{
                width: '100%', 
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password *
              </label>
              <input 
                type="password" 
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                style={{
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
                required
              />
              <small style={{ display: 'block', marginTop: '0.375rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Minimum 8 characters with at least one number
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="password_confirm" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Confirm Password *
              </label>
              <input 
                type="password" 
                id="password_confirm"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className="form-control"
                style={{
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="company" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Company Name
            </label>
            <input 
              type="text" 
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="form-control"
              style={{
                width: '100%', 
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="role" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Role *
            </label>
            <select 
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control"
              style={{
                width: '100%', 
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
              required
            >
              <option value="appraiser">Appraiser</option>
              <option value="reviewer">Reviewer</option>
              <option value="client">Client</option>
              <option value="field_agent">Field Agent</option>
            </select>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <input 
              type="checkbox" 
              id="terms_accepted"
              name="terms_accepted"
              checked={formData.terms_accepted}
              onChange={handleChange}
              style={{ marginRight: '0.5rem', marginTop: '0.25rem' }}
              required
            />
            <label htmlFor="terms_accepted" style={{ fontSize: '0.875rem' }}>
              I agree to the <Link to="/terms" style={{ color: '#2563eb' }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</Link>
            </label>
          </div>
          
          <div className="form-group">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.375rem',
                fontWeight: '500',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? '0.7' : '1'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;