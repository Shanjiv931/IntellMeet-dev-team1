import React, { useState, useEffect, useRef } from 'react';
import './Room.css';

export default function Room({ onNavigate, user }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [activePanel, setActivePanel] = useState('chat'); // 'chat' or 'ainotes'
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Timer State
  const [seconds, setSeconds] = useState(942); // Start at 15 mins 42 secs
  
  // Chat State
  const [messages, setMessages] = useState([
    { sender: "Tech Lead", initials: "TL", text: "Let's review Q3 product release endpoints." },
    { sender: "QA Lead", initials: "QA", text: "Testing schedules look good. We are ready." }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef(null);

  // Increment timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages([
      ...messages,
      { sender: user.name, initials: user.avatar, text: inputMsg }
    ]);
    setInputMsg('');
  };

  return (
    <div className="room-page">
      {/* Top Header Panel */}
      <header className="room-header">
        <div className="room-info">
          <h2>Q3 Strategy Planning</h2>
          <span className="room-badge">● Live Recording</span>
        </div>
        <div className="room-timer-box">
          <span className="timer-icon">⏳</span>
          <span className="timer-text">{formatTimer(seconds)}</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="room-main-container">
        {/* Video Area Grid */}
        <div className="room-video-area">
          <div className="video-area-grid">
            
            {/* Participant 1: Tech Lead */}
            <div className="participant-video-card active-speaker">
              <div className="video-avatar-box bg-blue">TL</div>
              <span className="participant-label">Tech Lead (Alex)</span>
              <div className="speaking-mic-badge">🎤 Speaker</div>
            </div>

            {/* Participant 2: QA Lead */}
            <div className="participant-video-card">
              <div className="video-avatar-box bg-teal">QA</div>
              <span className="participant-label">QA Lead (Sarah)</span>
            </div>

            {/* Participant 3: Shared Screen or Mock Placeholder */}
            {isSharingScreen ? (
              <div className="participant-video-card screen-share-card">
                <div className="screen-share-visual">🖥️ Sharing Screen</div>
                <span className="participant-label">You (Screen Share)</span>
              </div>
            ) : (
              <div className="participant-video-card empty-stream-placeholder">
                <div className="video-avatar-box bg-purple">IM</div>
                <span className="participant-label">IntellMeet Room Feed</span>
              </div>
            )}

            {/* Participant 4: You */}
            <div className="participant-video-card">
              {isCameraOff ? (
                <div className="video-off-avatar bg-primary">{user.avatar}</div>
              ) : (
                <div className="video-feed-mock user-feed">
                  <div className="user-feed-initials">{user.avatar}</div>
                  <span className="live-pill">Live Feed</span>
                </div>
              )}
              <span className="participant-label">You ({user.name}) {isMuted && '(Muted)'}</span>
            </div>

          </div>
        </div>

        {/* Right Sidebar Panel */}
        {showSidebar && (
          <aside className="room-sidebar">
            <div className="sidebar-tab-header">
              <button 
                className={`tab-toggle-btn ${activePanel === 'chat' ? 'active' : ''}`}
                onClick={() => setActivePanel('chat')}
              >
                💬 Chat ({messages.length})
              </button>
              <button 
                className={`tab-toggle-btn ${activePanel === 'ainotes' ? 'active' : ''}`}
                onClick={() => setActivePanel('ainotes')}
              >
                🤖 AI Notes
              </button>
              <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close sidebar">
                ✕
              </button>
            </div>

            <div className="sidebar-tab-content">
              {/* Chat View */}
              {activePanel === 'chat' && (
                <div className="chat-panel-container">
                  <div className="chat-messages-box">
                    {messages.map((msg, idx) => (
                      <div className="chat-message-bubble" key={idx}>
                        <div className="msg-avatar">{msg.initials}</div>
                        <div className="msg-content">
                          <span className="msg-sender">{msg.sender}</span>
                          <p className="msg-text">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendChat} className="chat-input-bar">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                    />
                    <button type="submit" className="btn-send-message">Send</button>
                  </form>
                </div>
              )}

              {/* AI Notes View */}
              {activePanel === 'ainotes' && (
                <div className="ainotes-panel-container">
                  <div className="ainotes-scroller">
                    <div className="ainotes-item border-left-blue">
                      <h5>🎙️ Real-time Transcript Highlight</h5>
                      <p>"Ensure Front-end modules use separate CSS stylesheets..."</p>
                    </div>
                    <div className="ainotes-item">
                      <h5>🤖 Key Discussion Point</h5>
                      <p>Discussed authentication workflow routes and validation check routines.</p>
                    </div>
                    <div className="ainotes-item">
                      <h5>✅ Action Items</h5>
                      <ul>
                        <li>Alex: Finalize sprint database schema configuration.</li>
                        <li>Sarah: Draft test cases for meeting logs.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Control Toolbar */}
      <footer className="room-controls-bar">
        <div className="controls-center-group">
          <button 
            className={`control-round-btn ${isMuted ? 'danger-muted' : 'active-white'}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? '🎙️' : '🎤'}
          </button>
          <button 
            className={`control-round-btn ${isCameraOff ? 'danger-muted' : 'active-white'}`}
            onClick={() => setIsCameraOff(!isCameraOff)}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? '📹' : '📷'}
          </button>
          <button 
            className={`control-round-btn ${isSharingScreen ? 'accent-green' : 'active-white'}`}
            onClick={() => setIsSharingScreen(!isSharingScreen)}
            title={isSharingScreen ? "Stop Screen Share" : "Share Screen"}
          >
            🖥️
          </button>
          <button 
            className={`control-round-btn ${showSidebar ? 'accent-blue' : 'active-white'}`}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle Sidebar Panel"
          >
            👥
          </button>
          <button 
            className="control-round-btn btn-leave"
            onClick={() => onNavigate('dashboard')}
            title="Leave Meeting"
          >
            📞
          </button>
        </div>
      </footer>
    </div>
  );
}
