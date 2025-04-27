/**
 * TerraFusionPro - Reset Password Page
 * Allows users to set a new password after reset request
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../components/layout/NotificationCenter';

/**
 * ResetPasswordPage Component
 */
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  
  const { error: authError } = useAuth();
  const notifications = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get('token');
    
    if (resetToken) {
      setToken(resetToken);
    } else {
      setTokenError('Missing password reset token. Please use the link from your email.');
    }
  }, [location]);
  
  // Evaluate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    // Calculate password strength
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Set strength label
    if (strength < 3) {
      setPasswordStrength('weak');
    } else if (strength < 5) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [password]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!password) {
      notifications.error('Please enter a new password');
      return;
    }
    
    if (password.length < 8) {
      notifications.error('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      notifications.error('Passwords do not match');
      return;
    }
    
    if (!token) {
      notifications.error('Missing reset token. Please use the link from your email.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call reset password API with token
      const response = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }
      
      // Success message
      notifications.success('Your password has been successfully reset');
      
      // Redirect to login
      navigate('/auth/login', { 
        replace: true,
        state: { message: 'Password reset successful. Please sign in with your new password.' }
      });
    } catch (error) {
      notifications.error(error.message || 'Failed to reset password. Please try again.');
      console.error('Password reset failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!passwordStrength) return null;
    
    return (
      <div className={`password-strength ${passwordStrength}`}>
        <div className="strength-bar"></div>
        <div className="strength-label">{passwordStrength}</div>
      </div>
    );
  };
  
  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <img 
            src="/assets/images/terrafusion-logo.svg" 
            alt="TerraFusionPro Logo" 
            className="reset-password-logo" 
          />
          <h1 className="reset-password-title">Create New Password</h1>
          <p className="reset-password-subtitle">
            Enter your new password to complete the reset process
          </p>
        </div>
        
        {(tokenError || authError) && (
          <div className="reset-password-error">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{tokenError || authError}</span>
            
            {tokenError && (
              <div className="error-actions">
                <Link to="/auth/forgot-password" className="error-action-link">
                  Request New Reset Link
                </Link>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">New Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              autoFocus
              disabled={!!tokenError}
            />
            {renderPasswordStrength()}
            <div className="password-requirements">
              <p>Password must:</p>
              <ul>
                <li className={password.length >= 8 ? 'met' : ''}>
                  Be at least 8 characters long
                </li>
                <li className={/[A-Z]/.test(password) ? 'met' : ''}>
                  Include at least one uppercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'met' : ''}>
                  Include at least one number
                </li>
                <li className={/[^A-Za-z0-9]/.test(password) ? 'met' : ''}>
                  Include at least one special character
                </li>
              </ul>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={!!tokenError}
            />
            {password && confirmPassword && password !== confirmPassword && (
              <div className="password-mismatch">
                Passwords do not match
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="reset-button"
            disabled={isSubmitting || !!tokenError}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
          
          <div className="form-links">
            <Link to="/auth/login" className="back-to-login">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
        
        <div className="reset-password-help">
          <p>
            Need assistance?{' '}
            <Link to="/help/login" className="help-link">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;