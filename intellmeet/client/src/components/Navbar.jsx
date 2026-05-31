import React, { useState } from 'react';
import './Navbar.css';

export default function Navbar({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#2563EB"/>
            <path d="M10 12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V20C22 21.1046 21.1046 22 20 22H12C10.8954 22 10 21.1046 10 20V12Z" fill="white"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB"/>
            <path d="M22 14L25.1464 12.4268C25.7766 12.1117 26.5 12.5692 26.5 13.2736V18.7264C26.5 19.4308 25.7766 19.8883 25.1464 19.5732L22 18V14Z" fill="white"/>
          </svg>
          <span className="logo-text">IntellMeet</span>
        </a>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <a href="#features" className="nav-link" onClick={() => setIsOpen(false)}>Features</a>
          <a href="#solutions" className="nav-link" onClick={() => setIsOpen(false)}>Solutions</a>
          <a href="#pricing" className="nav-link" onClick={() => setIsOpen(false)}>Pricing</a>
          <a href="#resources" className="nav-link" onClick={() => setIsOpen(false)}>Resources</a>
        </div>

        <div className="nav-actions">
          <button className="btn-signin" onClick={() => onNavigate('login')}>Sign In</button>
          <button className="btn-signup" onClick={() => onNavigate('signup')}>Get Started Free</button>
        </div>

        <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          <span className={`bar ${isOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isOpen ? 'active' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}
