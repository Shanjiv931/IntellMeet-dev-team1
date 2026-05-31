import React from 'react';
import './VideoCard.css';

export default function VideoCard({
  name,
  initials,
  isActiveSpeaker = false,
  isMuted = false,
  isCameraOff = false,
  isLocalUser = false,
  isScreenShare = false,
  avatarBg = 'bg-blue'
}) {
  // Map avatar bg class names to premium CSS gradients
  const getGradientClass = (bg) => {
    switch (bg) {
      case 'bg-blue':
        return 'gradient-blue';
      case 'bg-teal':
        return 'gradient-teal';
      case 'bg-purple':
        return 'gradient-purple';
      case 'bg-primary':
        return 'gradient-primary';
      default:
        return 'gradient-dark';
    }
  };

  return (
    <div className={`video-card ${isActiveSpeaker ? 'active-speaker' : ''} ${isScreenShare ? 'screen-share-mode' : ''}`}>
      {/* Active Speaker Glow overlay */}
      {isActiveSpeaker && <div className="speaker-border-glow" />}

      {/* Main Video Area */}
      <div className={`video-content-wrapper ${getGradientClass(avatarBg)}`}>
        {isScreenShare ? (
          <div className="screen-share-container">
            <div className="screen-share-overlay">
              <svg className="screen-share-icon animate-pulse" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span className="screen-share-text">Screen Share Active</span>
            </div>
          </div>
        ) : isCameraOff ? (
          <div className="video-off-container">
            <div className="avatar-ellipse">
              <span className="avatar-initials">{initials}</span>
            </div>
            <span className="video-off-indicator">Camera Off</span>
          </div>
        ) : (
          /* Simulated Live Feed */
          <div className={`video-feed-mock ${isLocalUser ? 'local-feed' : ''}`}>
            {isLocalUser && (
              <div className="local-feed-overlay">
                <span className="live-badge">
                  <span className="live-dot"></span>
                  Live
                </span>
              </div>
            )}
            <div className="feed-avatar-glow">
              <span className="feed-initials">{initials}</span>
            </div>
            {/* Visual audio wave representation for active speaker */}
            {isActiveSpeaker && (
              <div className="audio-wave">
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Overlay (Name, Mute state, etc) */}
      <div className="video-info-bar">
        <div className="info-left">
          <span className="participant-name">
            {name}
            {isLocalUser && <span className="you-pill">You</span>}
          </span>
        </div>
        <div className="info-right">
          {isMuted ? (
            <div className="status-pill status-muted" title="Muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
          ) : (
            isActiveSpeaker && (
              <div className="status-pill status-speaking" title="Speaking">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
