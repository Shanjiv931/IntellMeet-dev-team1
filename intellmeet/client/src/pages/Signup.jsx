import React, { useState } from 'react';
import './Signup.css';

export default function Signup({ onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError('');
    console.log('Signup attempt with:', { fullName, email, password });
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
              />
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
              />
            </div>

            <button type="submit" className="btn-signup-submit">Create Account</button>
          </form>

          <p className="login-prompt">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Sign in</a>
          </p>
        </div>
      </div>

      {/* Right panel: Marketing/Testimonial side */}
      <div className="signup-visual-panel">
        <div className="visual-glow"></div>
        <div className="visual-content">
          <div className="quote-card">
            <div className="stars">★★★★★</div>
            <p className="quote-text">
              "We connected IntellMeet with Slack and Jira. Now, action items are updated before our post-sprint standup even finishes!"
            </p>
            <div className="quote-author">
              <div className="author-avatar bg-teal">AS</div>
              <div>
                <div className="author-name">Alex Smith</div>
                <div className="author-title">Tech Lead, ApexHub</div>
              </div>
            </div>
          </div>
          
          <div className="metrics-row">
            <div className="metric-box">
              <span className="metric-number">10x</span>
              <span className="metric-label">Faster Summaries</span>
            </div>
            <div className="metric-box">
              <span className="metric-number">5 hrs</span>
              <span className="metric-label">Saved Weekly Per Team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
