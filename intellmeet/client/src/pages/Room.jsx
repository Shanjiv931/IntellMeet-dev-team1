import React, { useState, useEffect, useRef } from 'react';
import RoomHeader from '../components/room/RoomHeader';
import VideoGrid from '../components/room/VideoGrid';
import ChatPanel from '../components/room/ChatPanel';
import ParticipantsPanel from '../components/room/ParticipantsPanel';
import AiNotesPanel from '../components/room/AiNotesPanel';
import RoomControls from '../components/room/RoomControls';
import './Room.css';

export default function Room({ onNavigate, user }) {
  // Toolbar and Meeting States
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState('participants'); // 'chat', 'participants', or 'ainotes'
  
  // Timer State
  const [seconds, setSeconds] = useState(942); // Start at 15 mins 42 secs
  
  // Responsive check state
  const [isMobile, setIsMobile] = useState(false);
  
  // Chat Messages State
  const [messages, setMessages] = useState([
    { sender: "Tech Lead", initials: "TL", text: "Let's review Q3 product release endpoints." },
    { sender: "QA Lead", initials: "QA", text: "Testing schedules look good. We are ready." }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef(null);

  // Responsive Layout detection: switches sidebar format between Desktop Split and Mobile tabbed-overlay
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, the ChatPanel is always visible at the bottom.
      // If we resize from mobile to desktop while 'chat' is active, reset top section active tab to 'participants'.
      if (!mobile && activeSidebarTab === 'chat') {
        setActiveSidebarTab('participants');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [activeSidebarTab]);

  // Tick timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSidebar]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages([
      ...messages,
      { sender: user.name, initials: user.avatar, text: inputMsg }
    ]);
    setInputMsg('');
  };

  // Centralized helper to manage control bar sidebar triggers
  const handleToggleSidebarPanel = (panelName) => {
    if (showSidebar && activeSidebarTab === panelName) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
      setActiveSidebarTab(panelName);
    }
  };

  return (
    <div className="room-page">
      {/* Top Header Panel */}
      <RoomHeader title="Q3 Strategy Planning" seconds={seconds} />

      {/* Main Container */}
      <div className="room-main-container">
        {/* Video Area Grid */}
        <VideoGrid 
          user={user} 
          isMuted={isMuted} 
          isCameraOff={isCameraOff} 
          isSharingScreen={isSharingScreen} 
        />

        {/* Right Sidebar Panel */}
        {showSidebar && (
          <aside className="room-sidebar">
            {isMobile ? (
              /* Mobile Layout: Single view at a time using 3 tabs */
              <div className="sidebar-mobile-layout">
                <div className="sidebar-tab-header">
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('chat')}
                  >
                    💬 Chat ({messages.length})
                  </button>
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'participants' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('participants')}
                  >
                    👥 Participants
                  </button>
                  <button 
                    className={`tab-toggle-btn ${activeSidebarTab === 'ainotes' ? 'active' : ''}`}
                    onClick={() => setActiveSidebarTab('ainotes')}
                  >
                    🤖 AI Notes
                  </button>
                  <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close sidebar">
                    ✕
                  </button>
                </div>
                
                <div className="sidebar-tab-content">
                  {activeSidebarTab === 'chat' && (
                    <ChatPanel 
                      messages={messages}
                      inputMsg={inputMsg}
                      setInputMsg={setInputMsg}
                      handleSendChat={handleSendChat}
                      chatEndRef={chatEndRef}
                      currentUserInitials={user.avatar}
                    />
                  )}
                  {activeSidebarTab === 'participants' && (
                    <ParticipantsPanel 
                      user={user}
                      isMuted={isMuted}
                      isCameraOff={isCameraOff}
                      isSharingScreen={isSharingScreen}
                    />
                  )}
                  {activeSidebarTab === 'ainotes' && (
                    <AiNotesPanel />
                  )}
                </div>
              </div>
            ) : (
              /* Desktop Layout: Split view. Top (Participants OR AI Notes), Bottom (Chat always accessible) */
              <div className="sidebar-desktop-layout">
                <div className="sidebar-top-section">
                  <div className="sidebar-tab-header">
                    <button 
                      className={`tab-toggle-btn ${activeSidebarTab === 'participants' ? 'active' : ''}`}
                      onClick={() => setActiveSidebarTab('participants')}
                    >
                      👥 Participants
                    </button>
                    <button 
                      className={`tab-toggle-btn ${activeSidebarTab === 'ainotes' ? 'active' : ''}`}
                      onClick={() => setActiveSidebarTab('ainotes')}
                    >
                      🤖 AI Notes
                    </button>
                    <button className="sidebar-close-btn" onClick={() => setShowSidebar(false)} aria-label="Close sidebar">
                      ✕
                    </button>
                  </div>
                  <div className="sidebar-tab-content">
                    {activeSidebarTab === 'ainotes' ? (
                      <AiNotesPanel />
                    ) : (
                      <ParticipantsPanel 
                        user={user}
                        isMuted={isMuted}
                        isCameraOff={isCameraOff}
                        isSharingScreen={isSharingScreen}
                      />
                    )}
                  </div>
                </div>

                <div className="sidebar-bottom-section">
                  <ChatPanel 
                    messages={messages}
                    inputMsg={inputMsg}
                    setInputMsg={setInputMsg}
                    handleSendChat={handleSendChat}
                    chatEndRef={chatEndRef}
                    currentUserInitials={user.avatar}
                  />
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Control Toolbar */}
      <RoomControls
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isCameraOff={isCameraOff}
        onToggleCamera={() => setIsCameraOff(!isCameraOff)}
        isSharingScreen={isSharingScreen}
        onToggleScreenShare={() => setIsSharingScreen(!isSharingScreen)}
        showSidebar={showSidebar}
        activeSidebarTab={activeSidebarTab}
        onToggleSidebarPanel={handleToggleSidebarPanel}
        onLeaveMeeting={() => onNavigate('dashboard')}
      />
    </div>
  );
}
