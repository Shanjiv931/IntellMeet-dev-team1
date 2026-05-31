import React, { useState } from 'react';
import './Login.css';

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password, rememberMe });
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
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button type="submit" className="btn-signin-submit">Sign In</button>
          </form>

          <p className="signup-prompt">
            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}>Sign up for free</a>
          </p>
        </div>
      </div>

      {/* Right panel: Marketing/Testimonial side */}
      <div className="login-visual-panel">
        <div className="visual-glow"></div>
        <div className="visual-content">
          <div className="quote-card">
            <div className="stars">★★★★★</div>
            <p className="quote-text">
              "IntellMeet saves our product team over 5 hours of administrative summaries per sprint. The action items integration with Jira is seamless."
            </p>
            <div className="quote-author">
              <div className="author-avatar">JD</div>
              <div>
                <div className="author-name">Jane Cooper</div>
                <div className="author-title">VP of Product, TechCorp</div>
              </div>
            </div>
          </div>
          
          <div className="metrics-row">
            <div className="metric-box">
              <span className="metric-number">99.8%</span>
              <span className="metric-label">Transcription Accuracy</span>
            </div>
            <div className="metric-box">
              <span className="metric-number">10k+</span>
              <span className="metric-label">Meetings Summarized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
