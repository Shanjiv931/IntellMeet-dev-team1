import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardNavbar from '../components/DashboardNavbar';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard({ onNavigate, user }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [meetings, setMeetings] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const safeUser = user || { name: "Guest User", role: "Guest", avatar: "GU" };
  const firstName = (safeUser.name && typeof safeUser.name === 'string') ? safeUser.name.split(' ')[0] : 'Guest';

  // Load meetings on mount
  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/meetings');
      setMeetings(response.data.meetings || []);
    } catch (err) {
      console.error('Failed to load meetings', err);
      setError('Could not retrieve meetings from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Filter meetings into Scheduled vs Completed
  const upcomingMeetings = meetings.filter(m => m.status === 'SCHEDULED' || m.status === 'ACTIVE');
  const recentMeetings = meetings.filter(m => m.status === 'COMPLETED');

  // Hardcoded fallback reviews in case no meetings exist yet, keeping high-quality placeholders
  const staticRecentMeetings = [
    { id: 'static-1', title: "API Spec Review", date: "Yesterday", duration: "45 mins", summary: "The Product Manager finalized endpoint specifications; the Tech Lead approved auth flow schema implementation." },
    { id: 'static-2', title: "Customer Demo Run", date: "May 29, 2026", duration: "30 mins", summary: "Reviewed front-end login flows; team finalized custom checkboxes and remember me storage options." }
  ];

  const handleStartInstantMeeting = async () => {
    try {
      const title = `Instant Sync - ${firstName}`;
      const description = `Instant collaboration session launched by ${safeUser.name}`;
      
      const response = await api.post('/api/meetings', {
        title,
        description,
        startTime: new Date().toISOString()
      });

      const meeting = response.data.meeting;
      // Navigate to Lobby with target meeting context
      onNavigate('lobby', meeting);
    } catch (err) {
      alert('Failed to launch instant meeting room: ' + err.message);
    }
  };

  const handleScheduleCall = async () => {
    const title = prompt("Enter meeting title:", `Sprint Alignment - ${firstName}`);
    if (!title) return;

    try {
      const response = await api.post('/api/meetings', {
        title,
        description: "Scheduled sprint meeting session.",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Scheduled for tomorrow
      });

      alert('Meeting scheduled successfully!');
      fetchMeetings();
    } catch (err) {
      alert('Failed to schedule meeting: ' + err.message);
    }
  };

  const displayRecentList = recentMeetings.length > 0 ? recentMeetings : staticRecentMeetings;
  const currentSummaryItem = displayRecentList[selectedSummary] || displayRecentList[0];

  return (
    <div className="dashboard-layout">
      <Sidebar 
        onNavigate={onNavigate} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />
      
      <div className="dashboard-main">
        <DashboardNavbar user={safeUser} onLogout={() => setShowLogoutModal(true)} />
        
        <div className="dashboard-content container">
          {/* Header Row */}
          <div className="dashboard-welcome">
            <h1>Welcome Back, {firstName}!</h1>
            <p>Here is your meeting intelligence recap for today.</p>
          </div>

          {/* Quick Action Grid */}
          <div className="quick-actions-grid">
            <div className="action-card active-blue" onClick={handleStartInstantMeeting}>
              <div className="action-icon">🎥</div>
              <h3>Start Meeting</h3>
              <p>Launch instant room call</p>
            </div>
            <div className="action-card" onClick={handleScheduleCall}>
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
                  <span className="header-link" onClick={fetchMeetings}>🔄 Refresh</span>
                </div>
                
                {loading ? (
                  <div className="widget-loading-state">Loading schedules...</div>
                ) : upcomingMeetings.length === 0 ? (
                  <div className="widget-empty-state">
                    <p>No upcoming meetings scheduled.</p>
                    <button className="btn-join" onClick={handleStartInstantMeeting}>Launch One Now</button>
                  </div>
                ) : (
                  <div className="widget-list">
                    {upcomingMeetings.map(meeting => {
                      const dateObj = new Date(meeting.startTime);
                      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      
                      return (
                        <div className="meeting-row-item" key={meeting._id || meeting.id}>
                          <div className="meeting-info-col">
                            <h4>{meeting.title}</h4>
                            <span>{dateStr} at {timeStr}</span>
                          </div>
                          <button 
                            className="btn-join" 
                            onClick={() => onNavigate('lobby', meeting)}
                          >
                            Join
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Meetings Card */}
              <div className="widget-card">
                <div className="widget-header">
                  <h2>🎥 Recent Meetings</h2>
                  <span className="header-badge">History</span>
                </div>
                <div className="widget-list">
                  {displayRecentList.map((meeting, index) => {
                    const id = meeting._id || meeting.id || index;
                    return (
                      <div 
                        className={`meeting-row-item clickable ${selectedSummary === index ? 'active-row' : ''}`} 
                        key={id} 
                        onClick={() => setSelectedSummary(index)}
                      >
                        <div className="meeting-info-col">
                          <h4>{meeting.title}</h4>
                          <span>
                            {meeting.date || new Date(meeting.startTime).toLocaleDateString()} 
                            {meeting.duration ? ` • ${meeting.duration}` : ''}
                          </span>
                        </div>
                        <span className="arrow-indicator">➔</span>
                      </div>
                    );
                  })}
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
                {currentSummaryItem && (
                  <div className="ai-summary-body">
                    <h3>{currentSummaryItem.title} Summary</h3>
                    <div className="summary-section-box">
                      <p>{currentSummaryItem.summary || "This meeting summary was compiled by IntellMeet AI. Points include: finalizing endpoint routing structure, validating CORS, and establishing socket room loops."}</p>
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
                )}
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
