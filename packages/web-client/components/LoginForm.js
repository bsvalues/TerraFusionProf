/**
 * TerraFusionPro Web Client - Login Form Component
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const redirectPath = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Call the login function from AuthContext
      await login(email, password, rememberMe);
      
      // Redirect to the intended route or dashboard
      navigate(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="card" style={{ padding: '2rem', maxWidth: '450px', margin: '0 auto' }}>
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
        
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1e40af' }}>Login to Your Account</h1>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#b91c1c', 
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email Address
            </label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control" 
              placeholder="you@example.com"
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
          
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ fontWeight: '500' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
                Forgot password?
              </Link>
            </div>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="••••••••"
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
          
          <div className="form-group" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            <label htmlFor="remember-me">Remember me for 30 days</label>
          </div>
          
          <div className="form-group" style={{ marginTop: '2rem' }}>
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
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ fontWeight: '500', marginBottom: '1rem' }}>Or sign in with</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              Google
            </button>
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              Microsoft
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <p>By signing in, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
      </div>
    </div>
  );
};

export default LoginForm;