import React from 'react';
import './RoomControls.css';

export default function RoomControls({
  isMuted,
  onToggleMute,
  isCameraOff,
  onToggleCamera,
  isSharingScreen,
  onToggleScreenShare,
  showSidebar,
  activeSidebarTab,
  onToggleSidebarPanel, // Handler helper to manage panels
  onLeaveMeeting
}) {
  return (
    <footer className="room-controls-bar">
      <div className="controls-container">
        
        {/* Left spacing or room branding/details placeholder */}
        <div className="controls-left">
          <span className="meeting-security-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            End-to-End Encrypted
          </span>
        </div>

        {/* Center: Audio / Video / Screen controls */}
        <div className="controls-center-group">
          {/* Microphone Mute Button */}
          <button 
            className={`control-round-btn ${isMuted ? 'danger-muted' : 'active-white'}`}
            onClick={onToggleMute}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>

          {/* Camera Button */}
          <button 
            className={`control-round-btn ${isCameraOff ? 'danger-muted' : 'active-white'}`}
            onClick={onToggleCamera}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            aria-label={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            )}
          </button>

          {/* Screen Share Button */}
          <button 
            className={`control-round-btn ${isSharingScreen ? 'accent-green' : 'active-white'}`}
            onClick={onToggleScreenShare}
            title={isSharingScreen ? "Stop Screen Share" : "Share Screen"}
            aria-label={isSharingScreen ? "Stop Screen Share" : "Share Screen"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
        </div>

        {/* Right: Sidebar toggle panels & Leave button */}
        <div className="controls-right-group">
          {/* Toggle Participants */}
          <button 
            className={`control-square-btn ${(showSidebar && activeSidebarTab === 'participants') ? 'active-accent-blue' : 'inactive-white'}`}
            onClick={() => onToggleSidebarPanel('participants')}
            title="Toggle Participants Panel"
            aria-label="Toggle Participants Panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>

          {/* Toggle AI Notes */}
          <button 
            className={`control-square-btn ${(showSidebar && activeSidebarTab === 'ainotes') ? 'active-accent-purple' : 'inactive-white'}`}
            onClick={() => onToggleSidebarPanel('ainotes')}
            title="Toggle AI Notes Panel"
            aria-label="Toggle AI Notes Panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </button>

          {/* Toggle Chat (Mobile specific, or desktop helper) */}
          <button 
            className={`control-square-btn ${(showSidebar && activeSidebarTab === 'chat') ? 'active-accent-teal' : 'inactive-white'}`}
            onClick={() => onToggleSidebarPanel('chat')}
            title="Toggle Chat Panel"
            aria-label="Toggle Chat Panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          <div className="btn-divider"></div>

          {/* Leave Button */}
          <button 
            className="control-round-btn btn-leave"
            onClick={onLeaveMeeting}
            title="Leave Meeting"
            aria-label="Leave Meeting"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
              <line x1="23" y1="1" x2="1" y2="23"/>
            </svg>
          </button>
        </div>

      </div>
    </footer>
  );
}
