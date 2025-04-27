import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import NotificationContext from '../../contexts/NotificationContext';

/**
 * ForgotPassword Component
 * Handles password reset request
 */
const ForgotPassword = () => {
  const { requestPasswordReset } = useContext(AuthContext);
  const { success: showSuccess, error: showError } = useContext(NotificationContext);
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Handle input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    
    // Clear messages when user types
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Request password reset
      const result = await requestPasswordReset(email);
      
      if (!result.success) {
        setError(result.error || 'Password reset request failed');
        return;
      }
      
      // Show success message
      setSuccessMessage(
        result.message || 
        'Password reset link sent! Please check your email and follow the instructions to reset your password.'
      );
      
      showSuccess('Reset Link Sent', {
        message: 'Password reset instructions have been sent to your email'
      });
      
      // Clear email input
      setEmail('');
      
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('An unexpected error occurred. Please try again.');
      showError('Request Failed', { 
        message: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page forgot-password-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email to reset your password</p>
        </div>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="auth-success">
            {successMessage}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              className="form-control"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
      
      <div className="auth-info">
        <div className="info-content">
          <h2>Password Recovery</h2>
          <p>Follow these steps to reset your password:</p>
          
          <ol className="steps-list">
            <li>Enter your email address</li>
            <li>Check your inbox for the reset link</li>
            <li>Click on the link in the email</li>
            <li>Create your new password</li>
          </ol>
          
          <p className="info-note">
            If you don't receive an email within a few minutes, please check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;