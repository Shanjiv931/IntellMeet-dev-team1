import React, { useState } from 'react';
import api from '../utils/api';
import './Signup.css';

export default function Signup({ onNavigate, onSignupSuccess, defaultEmail = '' }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':",./\\|?~`<>]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!fullName || !fullName.trim() || fullName.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      setError("Password does not meet all complexity requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { 
        name: fullName.trim(), 
        email: email.trim(), 
        password,
        role: 'MEMBER'
      });
      onSignupSuccess(response.data);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Left panel: Signup form */}
      <div className="signup-form-panel">
        <div className="signup-form-header">
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

        <div className="signup-form-container">
          <h2>Create your account</h2>
          <p className="subtitle">Start automating your meeting notes and summaries free</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                required
                placeholder="Jane Cooper"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

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
              <label htmlFor="password">Password</label>
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

            <button type="submit" className="btn-signup-submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="login-prompt">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Sign in</a>
          </p>
        </div>
      </div>

      {/* Right panel: Premium Abstract Visualization */}
      <div className="signup-visual-panel">
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
