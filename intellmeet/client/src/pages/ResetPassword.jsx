import React, { useState } from 'react';
import api from '../utils/api';
import './ResetPassword.css';

export default function ResetPassword({ onNavigate, token }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':",./\\|?~`<>]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      setError("Password does not meet all complexity requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', { 
        token,
        password
      });
      if (response.success) {
        setSuccess('Your password has been changed successfully. You can now log in.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-panel">
        <div className="reset-password-header">
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

        <div className="reset-password-container">
          <h2>Create new password</h2>
          <p className="subtitle">Enter your new credentials below to configure a new password</p>

          {error && <div className="error-alert-box">{error}</div>}
          {success && <div className="success-alert-box">{success}</div>}

          {!success ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                
                <div className="password-requirements">
                  <p className={isLengthValid ? 'req-met' : 'req-unmet'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      {isLengthValid ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                    </svg>
                    At least 8 characters
                  </p>
                  <p className={hasUppercase ? 'req-met' : 'req-unmet'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      {hasUppercase ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                    </svg>
                    At least 1 uppercase letter
                  </p>
                  <p className={hasLowercase ? 'req-met' : 'req-unmet'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      {hasLowercase ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                    </svg>
                    At least 1 lowercase letter
                  </p>
                  <p className={hasNumber ? 'req-met' : 'req-unmet'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      {hasNumber ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                    </svg>
                    At least 1 number
                  </p>
                  <p className={hasSymbol ? 'req-met' : 'req-unmet'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      {hasSymbol ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                    </svg>
                    At least 1 symbol
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn-reset-submit" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <button 
              className="btn-signin-redirect"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Right panel: Premium Abstract Visualization */}
      <div className="reset-password-visual-panel">
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
