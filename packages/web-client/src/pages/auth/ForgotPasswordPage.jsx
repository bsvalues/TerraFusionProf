/**
 * TerraFusionPro - Forgot Password Page
 * Allows users to request a password reset
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../components/layout/NotificationCenter';

/**
 * ForgotPasswordPage Component
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { resetPassword, error: authError } = useAuth();
  const notifications = useNotifications();
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      notifications.error('Please enter your email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await resetPassword(email);
      
      // Mark as submitted
      setIsSubmitted(true);
      
      // Success message
      notifications.success('Password reset instructions have been sent to your email');
    } catch (error) {
      // Error is handled by auth context
      console.error('Password reset failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <img 
            src="/assets/images/terrafusion-logo.svg" 
            alt="TerraFusionPro Logo" 
            className="forgot-password-logo" 
          />
          <h1 className="forgot-password-title">Reset Your Password</h1>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>
        
        {authError && (
          <div className="forgot-password-error">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{authError}</span>
          </div>
        )}
        
        {isSubmitted ? (
          <div className="reset-success">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="success-title">Check Your Email</h2>
            <p className="success-message">
              We've sent password reset instructions to <strong>{email}</strong>. 
              Please check your email inbox and follow the instructions to reset your password.
            </p>
            <p className="note">
              If you don't see the email in your inbox, please check your spam or junk folder.
            </p>
            <div className="success-actions">
              <Link to="/auth/login" className="login-button">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
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
            
            <button 
              type="submit" 
              className="reset-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Reset Password'}
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
        )}
        
        <div className="forgot-password-help">
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

export default ForgotPasswordPage;