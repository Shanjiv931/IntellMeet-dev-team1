import React, { useState } from 'react';
import './Features.css';

export default function Features() {
  const [activeTab, setActiveTab] = useState(0);

  const featureTabs = [
    {
      title: "Smart Summaries",
      subtitle: "Instant key notes",
      desc: "IntellMeet processes your meeting transcript and yields organized bullet points, critical decisions, and task lists instantly.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      title: "Real-time Transcription",
      subtitle: "Never miss a word",
      desc: "Accurately record and label speakers dynamically. Support for over 30 global languages with instant key phrase highlight.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      )
    },
    {
      title: "Task Integrations",
      subtitle: "Instant workflows",
      desc: "Export meeting action items directly into Jira, Slack, Notion, or Asana without leaving the call environment.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    }
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        
        {/* Header */}
        <div className="section-header">
          <span className="section-pre">Core Capabilities</span>
          <h2 className="section-title">Turn Conversations Into Structured Actions</h2>
          <p className="section-desc">
            Powerful artificial intelligence features engineered to save your company time, eliminate meeting fatigue, and automate administration.
          </p>
        </div>

        {/* Dynamic Interactive Showcasing Layout */}
        <div className="features-showcase">
          {/* Left Column: Feature Buttons */}
          <div className="showcase-tabs">
            {featureTabs.map((tab, idx) => (
              <button
                key={idx}
                className={`tab-btn ${activeTab === idx ? 'active' : ''}`}
                onClick={() => setActiveTab(idx)}
              >
                <div className="tab-icon-wrapper">{tab.icon}</div>
                <div className="tab-text-wrapper">
                  <h3 className="tab-title">{tab.title}</h3>
                  <p className="tab-desc">{tab.subtitle}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Live Simulated Dashboard Preview */}
          <div className="showcase-preview">
            <div className="preview-display">
              {activeTab === 0 && (
                <div className="preview-content animate-fade">
                  <div className="preview-header">
                    <h4>IntellMeet Smart Summary</h4>
                    <span className="status-badge">Completed</span>
                  </div>
                  <div className="preview-body-content">
                    <div className="summary-card">
                      <h5>Quick Recap</h5>
                      <p>The team agreed on launching Phase 1 API endpoints by Friday. Jane Cooper will finalize the specifications. Alex will begin implementation of authentication routines.</p>
                    </div>
                    <div className="summary-bullets">
                      <h5>Key Decisions</h5>
                      <ul>
                        <li>Use Postgres for core database infrastructure.</li>
                        <li>Implement Vite as front-end builder for speed.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="preview-content animate-fade">
                  <div className="preview-header">
                    <h4>Live Transcription Stream</h4>
                    <span className="status-badge listening">Listening...</span>
                  </div>
                  <div className="preview-body-content">
                    <div className="transcription-stream">
                      <div className="transcript-block">
                        <span className="speaker-name text-blue">Jane (02:14)</span>
                        <p className="speaker-text">Can we align on using CSS modules? They limit scope collisions nicely.</p>
                      </div>
                      <div className="transcript-block">
                        <span className="speaker-name text-teal">Alex (02:30)</span>
                        <p className="speaker-text">Agreed. That keeps bundle size compact. Let's make sure files go into src/components.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="preview-content animate-fade">
                  <div className="preview-header">
                    <h4>Direct Tool Integrations</h4>
                    <span className="status-badge sync">Synced</span>
                  </div>
                  <div className="preview-body-content">
                    <div className="integration-cards">
                      <div className="integration-item">
                        <div className="integration-logo jira">J</div>
                        <div className="integration-info">
                          <h6>Jira Ticket Created</h6>
                          <span>IM-242: Auth Endpoint Setup</span>
                        </div>
                        <span className="badge-assigned">Alex</span>
                      </div>
                      <div className="integration-item">
                        <div className="integration-logo slack">S</div>
                        <div className="integration-info">
                          <h6>Slack Summary Pushed</h6>
                          <span>To channel #sprint-updates</span>
                        </div>
                        <span className="badge-sent">Sent</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enterprise Perks grid */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h4 className="card-title">Enterprise Security</h4>
            <p className="card-desc">End-to-end data encryption and compliant with GDPR, SOC2, and HIPAA regulations.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h4 className="card-title">Meeting Analytics</h4>
            <p className="card-desc">Analyze speaking ratios, sentiment patterns, and timeline highlights to optimize agendas.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h4 className="card-title">Sub-second Latency</h4>
            <p className="card-desc">Ultra-clear audio and video streams supported by global edge infrastructure.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
