import React, { useState } from 'react';
import api from '../utils/api';
import './ForgotPassword.css';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      if (response.success && response.data) {
        setSuccess('A password reset link has been successfully generated and sent to your email.');
        // Store dev token for testing simulation
        setDevToken(response.data.token || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-panel">
        <div className="forgot-password-header">
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

        <div className="forgot-password-container">
          <h2>Reset password</h2>
          <p className="subtitle">Enter your email and we'll help you configure a new password</p>

          {error && <div className="error-alert-box">{error}</div>}
          {success && <div className="success-alert-box">{success}</div>}

          {!success ? (
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

              <button type="submit" className="btn-forgot-submit" disabled={loading}>
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="dev-simulation-card">
              <p>For development and testing convenience, click the button below to simulate clicking the email link and configuring your new password.</p>
              <button 
                className="btn-dev-simulate"
                onClick={() => onNavigate('reset-password', devToken)}
              >
                Reset Password
              </button>
            </div>
          )}

          <p className="back-prompt">
            Remembered your password? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Sign in</a>
          </p>
        </div>
      </div>

      {/* Right panel: Premium Abstract Visualization */}
      <div className="forgot-password-visual-panel">
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
