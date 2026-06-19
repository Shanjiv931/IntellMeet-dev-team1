import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow"></div>
      <div className="container hero-container">
        
        {/* Left Side: Copywriting */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span className="badge-text">Real-time Summaries Enabled</span>
          </div>
          <h1 className="hero-title">
            Meetings Summarized. <br />
            <span className="gradient-text">Work Accelerated.</span>
          </h1>
          <p className="hero-description">
            IntellMeet automatically transcribes, analyzes, and extracts key decisions & action items from your video meetings. Focus on the discussion, let AI write the notes.
          </p>
          <div className="hero-cta">
            <button className="btn-primary">Start Free Trial</button>
            <button className="btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Watch Demo
            </button>
          </div>
          <div className="hero-social-proof">
            <span className="proof-text">Trusted by fast-growing teams at</span>
            <div className="proof-logos">
              <span className="logo-item">TechCorp</span>
              <span className="logo-item">ApexHub</span>
              <span className="logo-item">FloFlow</span>
              <span className="logo-item">WebStack</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Mockup */}
        <div className="hero-visual">
          <div className="mockup-window">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="mockup-title">Sprint Planning - IntellMeet Meeting</div>
              <div className="mockup-status">● Live</div>
            </div>
            
            <div className="mockup-body">
              {/* Meeting Stream */}
              <div className="meeting-main">
                <div className="video-grid">
                  <div className="video-card">
                    <div className="avatar-placeholder bg-blue">JD</div>
                    <span className="video-name">Jane Cooper (Product)</span>
                    <div className="audio-wave">
                      <span className="wave-bar active"></span>
                      <span className="wave-bar active"></span>
                      <span className="wave-bar active"></span>
                    </div>
                  </div>
                  <div className="video-card">
                    <div className="avatar-placeholder bg-teal">AS</div>
                    <span className="video-name">Alex Smith (Tech Lead)</span>
                  </div>
                </div>
                
                {/* Live Caption */}
                <div className="live-caption">
                  <span className="caption-speaker">Jane:</span> Let's finalise our API endpoints by Friday so front-end developers can start integration.
                </div>
              </div>

              {/* Sidebar: AI Notes Panel */}
              <div className="mockup-sidebar">
                <div className="sidebar-tab">IntellMeet AI</div>
                <div className="sidebar-section">
                  <div className="sidebar-section-title">REAL-TIME SUMMARY</div>
                  <div className="summary-bullet">Discussing Sprint 14 goals and API integration timelines.</div>
                </div>
                <div className="sidebar-section">
                  <div className="sidebar-section-title">ACTION ITEMS</div>
                  <div className="task-item">
                    <input type="checkbox" defaultChecked disabled />
                    <span>Alex: Create endpoints for auth</span>
                  </div>
                  <div className="task-item animate-pulse">
                    <input type="checkbox" disabled />
                    <span className="highlight-text">Jane: Finalize API endpoints docs (Friday)</span>
                  </div>
                  <div className="task-item">
                    <input type="checkbox" disabled />
                    <span>Sarah: Setup testing framework</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Meeting Footer Controls */}
            <div className="mockup-controls">
              <div className="controls-group">
                <div className="control-btn accent-red">Mic</div>
                <div className="control-btn">Video</div>
                <div className="control-btn">Share</div>
              </div>
              <div className="control-btn btn-end">Leave</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
