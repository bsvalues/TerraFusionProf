import React, { useState, useContext, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import NotificationContext from '../../contexts/NotificationContext';

/**
 * ResetPassword Component
 * Handles password reset with token
 */
const ResetPassword = () => {
  const { resetPassword } = useContext(AuthContext);
  const { success: showSuccess, error: showError } = useContext(NotificationContext);
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Validate token
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.password || !formData.confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Reset password
      const result = await resetPassword(token, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Password reset failed');
        return;
      }
      
      // Show success message
      setSuccessMessage(
        result.message || 
        'Your password has been reset successfully! You can now log in with your new password.'
      );
      
      showSuccess('Password Reset', {
        message: 'Your password has been successfully reset'
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      showError('Reset Failed', { 
        message: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-page reset-password-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Create a new password for your account</p>
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
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your new password"
              className="form-control"
              required
              autoFocus
              disabled={loading || successMessage}
            />
            <small className="form-text">
              Password must be at least 8 characters long and include a mix of letters, numbers, and special characters
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              className="form-control"
              required
              disabled={loading || successMessage}
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || successMessage || !token}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
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
          <h2>Create a Secure Password</h2>
          <p>Tips for creating a strong password:</p>
          
          <ul className="security-tips">
            <li>Use at least 8 characters</li>
            <li>Include uppercase and lowercase letters</li>
            <li>Add numbers and special characters</li>
            <li>Avoid using personal information</li>
            <li>Don't reuse passwords from other sites</li>
          </ul>
          
          <p className="info-note">
            After resetting your password, you'll be automatically redirected to the login page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;