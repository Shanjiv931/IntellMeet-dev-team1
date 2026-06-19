import React, { useState } from 'react';
import api from '../utils/api';
import './Login.css';

export default function Login({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      onLoginSuccess(response.data, rememberMe);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel: Login form */}
      <div className="login-form-panel">
        <div className="login-form-header">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#2563EB"/>
              <path d="M10 12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V20C22 21.1046 21.1046 22 20 22H12C10.8954 22 10 21.1046 10 20V12Z" fill="white"/>
              <circle cx="16" cy="16" r="3" fill="#2563EB"/>
              <path d="M22 14L25.1464 12.4268C25.7766 12.1117 26.5 12.5692 26.5 13.2736V18.7264C26.5 19.4308 25.7766 19.8883 25.1464 19.5732L22 18V14Z" fill="white"/>
            </svg>
            <span className="logo-text">IntellMeet</span>
          </a>
        </div>

        <div className="login-form-container">
          <h2>Welcome back</h2>
          <p className="subtitle">Enter your credentials to access your meeting dashboard</p>

          {error && <div className="error-alert-box">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <input
                type="password"
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button type="submit" className="btn-signin-submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="signup-prompt">
            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>Sign up for free</a>
          </p>
        </div>
      </div>

      {/* Right panel: Premium Abstract Visualization */}
      <div className="login-visual-panel">
        <div className="visual-glow"></div>
        <div className="visual-content">
          <div className="abstract-showcase">
            <div className="floating-sphere sphere-1"></div>
            <div className="floating-sphere sphere-2"></div>
            <div className="glass-card main-glass">
              <div className="brand-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-logo" style={{ marginRight: '4px' }}>
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
                </svg>
                <span>INTELLMEET AI</span>
              </div>
              <h3>Collaborate & Automate</h3>
              <p>Next-generation meeting intelligence, live WebRTC video, and instant AI-generated team actions.</p>
            </div>
            <div className="glass-card sub-glass glass-left">
              <span>Sub-200ms Latency</span>
            </div>
            <div className="glass-card sub-glass glass-right">
              <span>AI Insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
