import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardNavbar from '../components/DashboardNavbar';
import './Dashboard.css';

export default function Dashboard({ onNavigate, user = { name: "Product Manager", role: "Team Member", avatar: "PM" } }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedSummary, setSelectedSummary] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const upcomingMeetings = [
    { id: 1, title: "Q3 Strategy Planning", time: "Today, 2:00 PM - 3:00 PM", host: "Product Manager", members: ["PM", "TL", "FE"] },
    { id: 2, title: "Sprint Standup Meeting", time: "Tomorrow, 9:30 AM - 10:00 AM", host: "Tech Lead", members: ["TL", "PM", "QA"] }
  ];

  const recentMeetings = [
    { id: 1, title: "API Spec Review", date: "Yesterday", duration: "45 mins", summary: "The Product Manager finalized endpoint specifications; the Tech Lead approved auth flow schema implementation." },
    { id: 2, title: "Customer Demo Run", date: "May 29, 2026", duration: "30 mins", summary: "Reviewed front-end login flows; team finalized custom checkboxes and remember me storage options." }
  ];

  const firstName = user.name.split(' ')[0];

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onNavigate={onNavigate} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />
      
      <div className="dashboard-main">
        <DashboardNavbar user={user} onLogout={() => setShowLogoutModal(true)} />
        
        <div className="dashboard-content container">
          {/* Header Row */}
          <div className="dashboard-welcome">
            <h1>Welcome Back, {firstName}!</h1>
            <p>Here is your meeting intelligence recap for today.</p>
          </div>

          {/* Quick Action Grid */}
          <div className="quick-actions-grid">
            <div className="action-card active-blue">
              <div className="action-icon">🎥</div>
              <h3>Start Meeting</h3>
              <p>Launch instant room call</p>
            </div>
            <div className="action-card">
              <div className="action-icon">📅</div>
              <h3>Schedule Call</h3>
              <p>Book future meeting sprint</p>
            </div>
            <div className="action-card">
              <div className="action-icon">☁️</div>
              <h3>Upload Recording</h3>
              <p>Extract AI notes from MP4</p>
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="widgets-grid">
            {/* Left Side Widgets Column */}
            <div className="widgets-left-col">
              {/* Upcoming Meetings Card */}
              <div className="widget-card">
                <div className="widget-header">
                  <h2>📅 Upcoming Meetings</h2>
                  <span className="header-link">View calendar</span>
                </div>
                <div className="widget-list">
                  {upcomingMeetings.map(meeting => (
                    <div className="meeting-row-item" key={meeting.id}>
                      <div className="meeting-info-col">
                        <h4>{meeting.title}</h4>
                        <span>{meeting.time}</span>
                      </div>
                      <button className="btn-join" onClick={() => onNavigate('lobby')}>Join</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Meetings Card */}
              <div className="widget-card">
                <div className="widget-header">
                  <h2>🎥 Recent Meetings</h2>
                  <span className="header-link">See all</span>
                </div>
                <div className="widget-list">
                  {recentMeetings.map((meeting, index) => (
                    <div className="meeting-row-item clickable" key={meeting.id} onClick={() => setSelectedSummary(index)}>
                      <div className="meeting-info-col">
                        <h4>{meeting.title}</h4>
                        <span>{meeting.date} • {meeting.duration}</span>
                      </div>
                      <span className="arrow-indicator">➔</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side AI Summaries Widget Panel */}
            <div className="widgets-right-col">
              <div className="widget-card ai-summary-widget">
                <div className="widget-header">
                  <h2>🤖 AI Summaries Widget</h2>
                  <span className="header-badge">GPT-4o</span>
                </div>
                <div className="ai-summary-body">
                  <h3>{recentMeetings[selectedSummary].title} Summary</h3>
                  <div className="summary-section-box">
                    <p>{recentMeetings[selectedSummary].summary}</p>
                  </div>
                  <div className="action-items-list">
                    <h4>✅ Key Action Items</h4>
                    <div className="action-item-check">
                      <input type="checkbox" defaultChecked disabled />
                      <span>Create and document mock database tables</span>
                    </div>
                    <div className="action-item-check">
                      <input type="checkbox" disabled />
                      <span>Review client checkmarks and auth requirements</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Are you sure you want to logout?</h3>
            <p>You will need to sign back in to access your meeting summaries and action items.</p>
            <div className="modal-buttons">
              <button className="btn-modal-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-modal-logout" onClick={() => { setShowLogoutModal(false); onNavigate('landing'); }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
