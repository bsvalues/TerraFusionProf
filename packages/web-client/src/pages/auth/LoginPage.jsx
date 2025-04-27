/**
 * TerraFusionPro - Login Page
 * Provides user authentication interface
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../components/layout/NotificationCenter';

/**
 * LoginPage Component
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, error: authError } = useAuth();
  const notifications = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return url from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      notifications.error('Please enter both email and password');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password, rememberMe);
      
      // Success message
      notifications.success('Login successful!');
      
      // Navigate to return url or dashboard
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by auth context, so we don't need to do anything here
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img 
            src="/assets/images/terrafusion-logo.svg" 
            alt="TerraFusionPro Logo" 
            className="login-logo" 
          />
          <h1 className="login-title">Sign In to TerraFusionPro</h1>
          <p className="login-subtitle">
            Enter your credentials to access your account
          </p>
        </div>
        
        {authError && (
          <div className="login-error">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{authError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password" className="form-label">Password</label>
              <Link to="/auth/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="form-group remember-me">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-text">Remember me</span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/auth/register" className="register-link">
              Sign Up
            </Link>
          </p>
        </div>
        
        <div className="login-help">
          <p>
            Having trouble signing in?{' '}
            <Link to="/help/login" className="help-link">
              Get Help
            </Link>
          </p>
        </div>
      </div>
      
      <div className="login-image-container">
        <div className="image-overlay">
          <div className="overlay-content">
            <h2>Property Valuation Reimagined</h2>
            <p>
              TerraFusionPro brings together advanced analytics, 
              market insights, and professional tools to streamline 
              your property valuation workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;