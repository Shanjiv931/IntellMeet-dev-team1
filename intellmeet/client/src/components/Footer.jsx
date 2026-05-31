import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        
        {/* Company Summary & Newsletter */}
        <div className="footer-brand">
          <div className="footer-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#2563EB"/>
              <path d="M10 12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V20C22 21.1046 21.1046 22 20 22H12C10.8954 22 10 21.1046 10 20V12Z" fill="white"/>
              <circle cx="16" cy="16" r="3" fill="#2563EB"/>
              <path d="M22 14L25.1464 12.4268C25.7766 12.1117 26.5 12.5692 26.5 13.2736V18.7264C26.5 19.4308 25.7766 19.8883 25.1464 19.5732L22 18V14Z" fill="white"/>
            </svg>
            <span className="logo-text">IntellMeet</span>
          </div>
          <p className="brand-description">
            AI-powered video conference summaries, transcriptions, and automated workflow triggers.
          </p>
          <div className="newsletter-box">
            <input type="email" placeholder="Join our product newsletter" className="newsletter-input" />
            <button className="newsletter-btn">Subscribe</button>
          </div>
        </div>

        {/* Links Col 1 */}
        <div className="footer-links">
          <h4>Product</h4>
          <ul>
            <li><a href="#">Features</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Integrations</a></li>
            <li><a href="#">Security</a></li>
          </ul>
        </div>

        {/* Links Col 2 */}
        <div className="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press Kit</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* Links Col 3 */}
        <div className="footer-links">
          <h4>Resources</h4>
          <ul>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">API Docs</a></li>
            <li><a href="#">Community</a></li>
          </ul>
        </div>

      </div>

      {/* Footer Bottom copyright area */}
      <div className="footer-bottom">
        <div className="container bottom-container">
          <span className="copyright">© 2026 IntellMeet Inc. All rights reserved.</span>
          <div className="bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
