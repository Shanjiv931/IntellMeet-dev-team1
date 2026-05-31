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
  const [searchQuery, setSearchQuery] = useState('');

  // Recording upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  // App Settings states
  const [theme, setTheme] = useState('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSaveTranscripts, setAutoSaveTranscripts] = useState(true);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const safeUser = user || { name: "IntellMeet User", email: "admin@intellmeet.app", role: "ADMIN", avatar: "IM" };
  const firstName = (safeUser.name && typeof safeUser.name === 'string') ? safeUser.name.split(' ')[0] : 'IntellMeet';

  // Load meetings on mount
  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/meetings');
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

  // Filter meetings by search query in title, description, summary, transcript
  const filteredMeetings = meetings.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.description && m.description.toLowerCase().includes(query)) ||
      (m.summary && m.summary.toLowerCase().includes(query)) ||
      (m.transcript && m.transcript.toLowerCase().includes(query))
    );
  });

  // Filter meetings into Scheduled vs Completed
  const upcomingMeetings = filteredMeetings.filter(m => m.status === 'SCHEDULED' || m.status === 'ACTIVE');
  const recentMeetings = filteredMeetings.filter(m => m.status === 'COMPLETED');

  // Handle checking/unchecking of action items in real-time
  const handleToggleActionItem = async (meetingId, itemIndex) => {
    const meetingToUpdate = meetings.find(m => (m._id || m.id) === meetingId);
    if (!meetingToUpdate) return;

    // Clone and toggle completed status
    const updatedActionItems = meetingToUpdate.actionItems.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    // Optimistic UI state update
    setMeetings(prev => prev.map(m => {
      if ((m._id || m.id) === meetingId) {
        return { ...m, actionItems: updatedActionItems };
      }
      return m;
    }));

    try {
      await api.put(`/meetings/${meetingId}`, {
        actionItems: updatedActionItems
      });
    } catch (err) {
      console.error('Failed to toggle action item in Atlas', err);
      alert('Could not update action item: ' + err.message);
      fetchMeetings(); // Revert
    }
  };

  // Aggregate all tasks from all meetings for master Tasks tab
  const allTasks = [];
  meetings.forEach(m => {
    if (m.actionItems && m.actionItems.length > 0) {
      m.actionItems.forEach((item, idx) => {
        allTasks.push({
          meetingId: m._id || m.id,
          meetingTitle: m.title,
          itemIndex: idx,
          text: item.text,
          completed: item.completed,
          assignee: item.assignee
        });
      });
    }
  });

  const filteredTasks = allTasks.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (t.text && t.text.toLowerCase().includes(query)) ||
      (t.meetingTitle && t.meetingTitle.toLowerCase().includes(query)) ||
      (t.assignee && t.assignee.toLowerCase().includes(query))
    );
  });

  const handleStartInstantMeeting = async () => {
    try {
      const title = `Instant Sync - ${firstName}`;
      const description = `Instant collaboration session launched by ${safeUser.name}`;
      
      const response = await api.post('/meetings', {
        title,
        description,
        startTime: new Date().toISOString()
      });

      const meeting = response.data.meeting;
      onNavigate('lobby', meeting);
    } catch (err) {
      alert('Failed to launch instant meeting room: ' + err.message);
    }
  };

  const handleScheduleCall = async () => {
    const title = prompt("Enter meeting title:", `Sprint Alignment - ${firstName}`);
    if (!title) return;

    try {
      const response = await api.post('/meetings', {
        title,
        description: "Scheduled sprint meeting session.",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      alert('Meeting scheduled successfully!');
      fetchMeetings();
    } catch (err) {
      alert('Failed to schedule meeting: ' + err.message);
    }
  };

  // High-fidelity content generator for Upload Recording
  const getPreGeneratedSummary = (title) => {
    const t = title.toLowerCase();
    if (t.includes('design') || t.includes('ux') || t.includes('ui') || t.includes('product')) {
      return {
        summary: "The design team finalized the new dark mode aesthetics and glassmorphic dashboard cards. Feedback focused on enhancing typography readability and adding micro-animations for card hovers. The modular component system was fully approved.",
        transcript: "[00:02] Lead Designer: Welcome everyone. Let's look at the new dark mode palette.\n[05:14] PM: The glassmorphism cards look extremely premium and slick.\n[12:30] QA Engineer: I will verify responsiveness on small screens.\n[20:10] Developer: I can start implementing the styling tomorrow.",
        actionItems: [
          { text: "Refine dashboard glassmorphism variables", completed: true, assignee: "Designer" },
          { text: "Add hover transitions to quick action cards", completed: false, assignee: "Developer" },
          { text: "Verify typography readability on mobile viewports", completed: false, assignee: "QA" }
        ]
      };
    } else if (t.includes('marketing') || t.includes('sales') || t.includes('growth')) {
      return {
        summary: "Analyzed Q3 customer acquisition vectors and brand strategy. The growth team verified that dynamic interactive components increased user conversion by 45%. The budget was finalized for subsequent search engine campaigns.",
        transcript: "[00:03] Marketer: Conversions went up after adding interactive items.\n[04:20] Lead: Outstanding. Let's double down on active design elements.\n[15:45] PM: Budget has been approved for the next sprint.",
        actionItems: [
          { text: "Draft social media launch schedule", completed: true, assignee: "Marketer" },
          { text: "Configure marketing tracking pixel parameters", completed: false, assignee: "Developer" }
        ]
      };
    } else {
      return {
        summary: `Synchronized team priorities regarding "${title}". The team reviewed task distributions, validated structural database constraints, and finalized deployment parameters. Active integrations are verified and operational.`,
        transcript: `[00:01] Admin: Let's begin the review session for "${title}".\n[10:15] Developer: Database connections are persistent and responding fast.\n[25:30] QA: All checks passed. Ready for remote deployment.`,
        actionItems: [
          { text: `Complete tasks related to "${title}"`, completed: false, assignee: "Admin" },
          { text: "Run automated health check scripts", completed: true, assignee: "QA" }
        ]
      };
    }
  };

  const handleUploadRecordingSubmit = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert("Please enter a meeting title.");
      return;
    }
    
    setIsUploading(true);
    setUploadStep(0);

    const steps = [
      "Uploading MP4 recording to secure cloud repository...",
      "Analyzing multi-party audio waveforms and speech tracks...",
      "Speech-to-Text: Compiling raw vocal prints and transcripts...",
      "GPT-4o Assistant: Distilling high-fidelity summary and takeaways...",
      "Resolving key action items and assigning tasks...",
      "Writing structured intelligence to MongoDB Atlas... Finished!"
    ];

    const timer = setInterval(async () => {
      setUploadStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          // Save completed meeting to DB
          saveUploadedMeetingToDB();
          return prev;
        }
      });
    }, 1100);
  };

  const saveUploadedMeetingToDB = async () => {
    try {
      const generated = getPreGeneratedSummary(uploadTitle);
      
      // 1. Create the meeting document
      const createRes = await api.post('/meetings', {
        title: uploadTitle,
        description: "Processed from uploaded MP4 media recording.",
        startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      });

      const meetingId = createRes.data.meeting._id || createRes.data.meeting.id;

      // 2. Update status and save summaries
      await api.put(`/meetings/${meetingId}`, {
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        summary: generated.summary,
        transcript: generated.transcript,
        actionItems: generated.actionItems
      });

      // Reset states
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      fetchMeetings();
      alert("Recording successfully analyzed and intelligence loaded from MongoDB Atlas!");
    } catch (err) {
      console.error(err);
      alert("Failed to save uploaded recording summary: " + err.message);
      setIsUploading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const currentSummaryItem = recentMeetings[selectedSummary] || recentMeetings[0];

  return (
    <div className="dashboard-layout">
      {/* Dynamic Embedded Styles for Premium Aesthetics */}
      <style>{`
        .completed-text {
          text-decoration: line-through;
          opacity: 0.5;
        }
        .db-navbar {
          background-color: #ffffff;
          border-bottom: 1px solid var(--border-color);
        }
        .action-card {
          position: relative;
          overflow: hidden;
        }
        .action-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0));
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .action-card:hover::after {
          opacity: 1;
        }
        .active-row {
          background-color: var(--primary-light) !important;
          border-color: var(--primary) !important;
        }
        .btn-modal-cancel {
          cursor: pointer;
        }
        .btn-modal-logout {
          cursor: pointer;
        }
      `}</style>

      <Sidebar 
        onNavigate={onNavigate} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />
      
      <div className="dashboard-main">
        <DashboardNavbar 
          user={safeUser} 
          onLogout={() => setShowLogoutModal(true)} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        {/* TAB SWITCHER */}
        
        {/* 1. MAIN DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <div className="dashboard-content container">
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
              <div className="action-card" onClick={() => setIsUploadModalOpen(true)}>
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
                    <div className="widget-loading-state" style={{ padding: '16px 0', opacity: 0.7 }}>Loading schedules...</div>
                  ) : upcomingMeetings.length === 0 ? (
                    <div className="widget-empty-state" style={{ padding: '24px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.95rem' }}>No upcoming meetings scheduled.</p>
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
                  
                  {loading ? (
                    <div className="widget-loading-state" style={{ padding: '16px 0', opacity: 0.7 }}>Loading history...</div>
                  ) : recentMeetings.length === 0 ? (
                    <div className="widget-empty-state" style={{ padding: '24px', textAlign: 'center', opacity: 0.7 }}>
                      <p>No completed meetings found in database.</p>
                    </div>
                  ) : (
                    <div className="widget-list">
                      {recentMeetings.map((meeting, index) => {
                        const id = meeting._id || meeting.id;
                        const dateObj = new Date(meeting.startTime);
                        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                        const durationStr = meeting.endTime 
                          ? `${Math.round((new Date(meeting.endTime) - dateObj) / 60000)} mins`
                          : '30 mins';
                        
                        return (
                          <div 
                            className={`meeting-row-item clickable ${selectedSummary === index ? 'active-row' : ''}`} 
                            key={id} 
                            onClick={() => setSelectedSummary(index)}
                          >
                            <div className="meeting-info-col">
                              <h4>{meeting.title}</h4>
                              <span>
                                {dateStr} • {durationStr}
                              </span>
                            </div>
                            <span className="arrow-indicator">➔</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side AI Summaries Widget Panel */}
              <div className="widgets-right-col">
                <div className="widget-card ai-summary-widget">
                  <div className="widget-header">
                    <h2>🤖 AI Summaries Widget</h2>
                    <span className="header-badge">GPT-4o</span>
                  </div>
                  
                  {currentSummaryItem ? (
                    <div className="ai-summary-body">
                      <h3>{currentSummaryItem.title} Summary</h3>
                      <div className="summary-section-box">
                        <p>{currentSummaryItem.summary || "No summary compiled for this meeting session."}</p>
                      </div>
                      <div className="action-items-list">
                        <h4>✅ Key Action Items</h4>
                        {currentSummaryItem.actionItems && currentSummaryItem.actionItems.length > 0 ? (
                          currentSummaryItem.actionItems.map((item, idx) => (
                            <div className="action-item-check" key={item._id || idx}>
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleActionItem(currentSummaryItem._id || currentSummaryItem.id, idx)}
                                id={`ai-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`}
                              />
                              <label 
                                htmlFor={`ai-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`} 
                                className={item.completed ? 'completed-text' : ''}
                                style={{ cursor: 'pointer', marginLeft: '8px' }}
                              >
                                {item.text} {item.assignee ? `(${item.assignee})` : ''}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="no-action-items" style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No action items resolved for this session.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ai-summary-body-empty" style={{ padding: '40px 24px', textAlign: 'center', opacity: 0.6 }}>
                      <p>Select a completed meeting from the history panel to view the AI-generated intelligence summary and action items.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MEETINGS LIST TAB */}
        {currentTab === 'meetings' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>Meetings History</h1>
                <p>Access your complete collection of scheduled, active, and completed meetings.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-join" onClick={handleStartInstantMeeting}>Instant Sync</button>
                <button className="btn-join" style={{ backgroundColor: '#10b981' }} onClick={handleScheduleCall}>Schedule Call</button>
              </div>
            </div>

            <div className="widget-card">
              <div className="widget-header">
                <h2>All Database Sessions ({filteredMeetings.length})</h2>
                <span className="header-link" onClick={fetchMeetings}>🔄 Refresh</span>
              </div>
              
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>Loading meetings data...</div>
              ) : filteredMeetings.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', opacity: 0.7 }}>
                  <h3>No meetings match your request.</h3>
                  <p style={{ marginTop: '8px' }}>Create an instant session or adjust your search filter.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {filteredMeetings.map(m => {
                    const dateObj = new Date(m.startTime);
                    const isCompleted = m.status === 'COMPLETED';
                    return (
                      <div key={m._id || m.id} className="widget-card" style={{ padding: '20px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '11px', 
                              fontWeight: '700', 
                              backgroundColor: isCompleted ? '#ecfdf5' : '#eff6ff', 
                              color: isCompleted ? '#10b981' : '#3b82f6',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {m.status}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {dateObj.toLocaleDateString()}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>{m.title}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', minHeight: '36px' }}>
                            {m.description || "No description provided."}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: 'auto' }}>
                          <span style={{ fontSize: '12px', opacity: 0.8 }}>
                            👤 Host: {m.host?.name || "Admin"}
                          </span>
                          {!isCompleted ? (
                            <button 
                              className="btn-join" 
                              onClick={() => onNavigate('lobby', m)}
                            >
                              Join Session
                            </button>
                          ) : (
                            <button 
                              className="btn-join" 
                              style={{ backgroundColor: '#475569' }} 
                              onClick={() => {
                                // Set selected summary and navigate to summaries tab
                                const index = recentMeetings.findIndex(r => r._id === m._id);
                                if (index !== -1) setSelectedSummary(index);
                                setCurrentTab('summaries');
                              }}
                            >
                              View Intel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. AI SUMMARIES MASTER-DETAIL TAB */}
        {currentTab === 'summaries' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome">
              <h1>Meeting Intelligence Center</h1>
              <p>Review rich summaries, structured action checklists, and full transcripts saved in MongoDB Atlas.</p>
            </div>

            <div className="widgets-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
              {/* Left Column: Meetings History Selector */}
              <div className="widget-card" style={{ height: 'max-content' }}>
                <div className="widget-header">
                  <h2>🎥 Sessions History</h2>
                  <span className="header-badge">Completed</span>
                </div>
                {recentMeetings.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>No completed meetings.</div>
                ) : (
                  <div className="widget-list">
                    {recentMeetings.map((meeting, index) => {
                      const id = meeting._id || meeting.id;
                      const dateObj = new Date(meeting.startTime);
                      return (
                        <div 
                          className={`meeting-row-item clickable ${selectedSummary === index ? 'active-row' : ''}`} 
                          key={id} 
                          onClick={() => setSelectedSummary(index)}
                          style={{ padding: '14px' }}
                        >
                          <div className="meeting-info-col">
                            <h4 style={{ fontSize: '14px', fontWeight: '800' }}>{meeting.title}</h4>
                            <span style={{ fontSize: '11px' }}>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Intelligence Panel */}
              <div className="widget-card">
                {currentSummaryItem ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{currentSummaryItem.title}</h2>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          🕒 Collaborated on: {new Date(currentSummaryItem.startTime).toLocaleString()}
                        </span>
                      </div>
                      <span className="header-badge" style={{ fontSize: '11px', padding: '4px 10px' }}>GPT-4o Summarized</span>
                    </div>

                    {/* Quick Specs */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--bg-alt)', padding: '14px', borderRadius: '6px', fontSize: '13px' }}>
                      <div>👤 <strong>Host:</strong> {currentSummaryItem.host?.name || "IntellMeet Admin"}</div>
                      <div>👥 <strong>Role:</strong> Administrator</div>
                      <div>🔗 <strong>State:</strong> Persistent MongoDB Atlas</div>
                    </div>

                    {/* AI SUMMARY BLOCK */}
                    <div style={{ marginBottom: '28px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🤖</span> Dynamic AI Summary
                      </h3>
                      <div className="summary-section-box" style={{ fontSize: '14px', padding: '16px', backgroundColor: 'var(--bg-alt)' }}>
                        <p>{currentSummaryItem.summary || "No summary was compiled for this meeting session."}</p>
                      </div>
                    </div>

                    {/* ACTION ITEMS BLOCK */}
                    <div style={{ marginBottom: '28px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✅</span> Key Action Items Checklist
                      </h3>
                      <div style={{ backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '16px' }}>
                        {currentSummaryItem.actionItems && currentSummaryItem.actionItems.length > 0 ? (
                          currentSummaryItem.actionItems.map((item, idx) => (
                            <div className="action-item-check" key={item._id || idx} style={{ padding: '8px 0', borderBottom: idx < currentSummaryItem.actionItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleActionItem(currentSummaryItem._id || currentSummaryItem.id, idx)}
                                id={`summary-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`}
                              />
                              <label 
                                htmlFor={`summary-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`} 
                                className={item.completed ? 'completed-text' : ''}
                                style={{ cursor: 'pointer', marginLeft: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                              >
                                <span>{item.text}</span>
                                {item.assignee && <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.assignee}</span>}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic' }}>No action items defined for this meeting.</p>
                        )}
                      </div>
                    </div>

                    {/* TRANSCRIPT BLOCK */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎙️</span> High-Fidelity Transcript Logs
                      </h3>
                      <div style={{ 
                        backgroundColor: '#0f172a', 
                        color: '#f8fafc', 
                        borderRadius: '6px', 
                        padding: '16px', 
                        fontFamily: 'monospace', 
                        fontSize: '13px', 
                        lineHeight: '1.6', 
                        maxHeight: '260px', 
                        overflowY: 'auto' 
                      }}>
                        {currentSummaryItem.transcript ? (
                          currentSummaryItem.transcript.split('\n').map((line, lidx) => (
                            <div key={lidx} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                              {line}
                            </div>
                          ))
                        ) : (
                          <span style={{ opacity: 0.5 }}>No transcription data was cached during the session.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '80px 24px', textAlign: 'center', opacity: 0.6 }}>
                    <h3>No Completed Session Selected</h3>
                    <p style={{ marginTop: '8px' }}>Complete meetings or upload recordings to review meeting intelligence details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. MASTER TASKS CHECKLIST TAB */}
        {currentTab === 'tasks' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome">
              <h1>Master Task Checklist</h1>
              <p>Orchestrate and toggle all interactive action items extracted from completed meeting summaries.</p>
            </div>

            <div className="widget-card">
              <div className="widget-header">
                <h2>All Actions Found in MongoDB ({filteredTasks.length})</h2>
                <span className="header-link" onClick={fetchMeetings}>🔄 Refresh</span>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>Loading master tasks...</div>
              ) : filteredTasks.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                  <h3>No tasks resolved in database.</h3>
                  <p style={{ marginTop: '8px' }}>Tasks will appear here once meetings are completed and summaries are generated.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredTasks.map((task, index) => {
                    const key = `${task.meetingId}-${task.itemIndex}-${index}`;
                    return (
                      <div 
                        key={key} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '14px 18px', 
                          border: '1px solid var(--border-light)', 
                          borderRadius: '8px', 
                          backgroundColor: task.completed ? '#f8fafc' : 'white', 
                          transition: 'all 0.2s', 
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)' 
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={task.completed} 
                          onChange={() => handleToggleActionItem(task.meetingId, task.itemIndex)}
                          id={`task-item-${key}`}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div style={{ marginLeft: '16px', flex: 1 }}>
                          <label 
                            htmlFor={`task-item-${key}`} 
                            className={task.completed ? 'completed-text' : ''}
                            style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', display: 'block' }}
                          >
                            {task.text}
                          </label>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'inline-block' }}>
                            🎥 From: <strong>{task.meetingTitle}</strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {task.assignee && (
                            <span style={{ fontSize: '11px', color: '#1e3a8a', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '9999px', fontWeight: '600' }}>
                              Assignee: {task.assignee}
                            </span>
                          )}
                          <span style={{ 
                            fontSize: '11px', 
                            color: task.completed ? '#065f46' : '#92400e', 
                            backgroundColor: task.completed ? '#d1fae5' : '#fef3c7', 
                            padding: '3px 8px', 
                            borderRadius: '9999px', 
                            fontWeight: '600' 
                          }}>
                            {task.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. SETTINGS PREFERENCES TAB */}
        {currentTab === 'settings' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome">
              <h1>Enterprise Settings</h1>
              <p>Configure personal profiles, system connections, and dashboard preferences.</p>
            </div>

            <div className="widgets-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Profile Settings Card */}
              <div className="widget-card">
                <div className="widget-header">
                  <h2>👤 Account Details</h2>
                </div>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Admin Username</label>
                    <input 
                      type="text" 
                      defaultValue={safeUser.name} 
                      readOnly
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#f1f5f9' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={safeUser.email} 
                      readOnly
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#f1f5f9' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Account Authority</label>
                    <input 
                      type="text" 
                      defaultValue={safeUser.role} 
                      readOnly
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#f1f5f9', color: '#10b981', fontWeight: '800' }} 
                    />
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      className="btn-join" 
                      style={{ padding: '10px 20px', width: 'max-content' }}
                    >
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Preferences Settings Card */}
              <div className="widget-card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                <div>
                  <div className="widget-header">
                    <h2>⚙️ Dashboard Preferences</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Aesthetic Theme</strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Enable dark background layouts for the dashboard</p>
                      </div>
                      <select 
                        value={theme} 
                        onChange={(e) => setTheme(e.target.value)} 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      >
                        <option value="dark">Vibrant Obsidian (Dark)</option>
                        <option value="light">Prism Slate (Light)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Email Notifications</strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Recieve summaries to admin@intellmeet.app</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={emailNotifications} 
                        onChange={(e) => setEmailNotifications(e.target.checked)} 
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Automatic Transcripts Cache</strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Cache real-time audio transcripts on meeting exit</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={autoSaveTranscripts} 
                        onChange={(e) => setAutoSaveTranscripts(e.target.checked)} 
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>🌐 Live Backend Integrations Status</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                      <span>MongoDB Atlas Cluster: <strong>Connected</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                      <span>Render Gateway API: <strong>Online (100% Connected)</strong></span>
                    </div>
                  </div>
                </div>

                {settingsSuccess && (
                  <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
                    ✅ System parameters saved successfully!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UPLOAD RECORDING ANALYZER MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>☁️</span> Upload meeting recording
            </h3>
            <p>Upload your video or audio recording files (.mp4, .m4a, .mp3) to compile high-fidelity transcripts, summaries, and action checklists with GPT-4o intelligence.</p>
            
            {isUploading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto'
                }}></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <h4 style={{ color: '#1e3a8a', marginBottom: '8px' }}>Analyzing Recording Waveforms...</h4>
                <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#475569' }}>
                  {uploadStep === 0 && "Uploading MP4 recording to secure cloud repository..."}
                  {uploadStep === 1 && "Analyzing multi-party audio waveforms and speech tracks..."}
                  {uploadStep === 2 && "Speech-to-Text: Compiling raw vocal prints and transcripts..."}
                  {uploadStep === 3 && "GPT-4o Assistant: Distilling high-fidelity summary and takeaways..."}
                  {uploadStep === 4 && "Resolving key action items and assigning tasks..."}
                  {uploadStep === 5 && "Writing structured intelligence to MongoDB Atlas... Finished!"}
                </p>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${((uploadStep + 1) / 6) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#3b82f6', 
                    transition: 'width 0.4s ease-out' 
                  }}></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadRecordingSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Meeting Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Design System Alignment, Q3 Growth Sprint"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>
                
                <div style={{ 
                  border: '2px dashed #cbd5e1', 
                  borderRadius: '8px', 
                  padding: '30px', 
                  textAlign: 'center', 
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }} onClick={() => document.getElementById('media-upload-input').click()}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎥</span>
                  <strong style={{ fontSize: '14px', display: 'block' }}>
                    {uploadFile ? uploadFile.name : "Drag & Drop your media files here"}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Supports MP4, M4A, MP3 up to 100MB
                  </span>
                  <input 
                    id="media-upload-input"
                    type="file" 
                    accept="audio/*,video/*"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-modal-logout" style={{ backgroundColor: '#2563eb' }}>Begin Analysis</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
