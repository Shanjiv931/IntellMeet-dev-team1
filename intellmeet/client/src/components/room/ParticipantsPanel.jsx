import React, { useState } from 'react';
import './ParticipantsPanel.css';

export default function ParticipantsPanel({
  user,
  isMuted,
  isCameraOff,
  isSharingScreen
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Define full participants list
  const participants = [
    {
      id: 'user',
      name: `${user.name} (You)`,
      initials: user.avatar,
      role: 'Host',
      isMuted: isMuted,
      isCameraOff: isCameraOff,
      isSharingScreen: isSharingScreen,
      avatarBg: 'gradient-primary'
    },
    {
      id: 'alex',
      name: 'Tech Lead (Alex)',
      initials: 'TL',
      role: 'Co-Host',
      isMuted: false,
      isCameraOff: false,
      isSharingScreen: false,
      avatarBg: 'gradient-blue'
    },
    {
      id: 'sarah',
      name: 'QA Lead (Sarah)',
      initials: 'QA',
      role: 'Participant',
      isMuted: false,
      isCameraOff: false,
      isSharingScreen: false,
      avatarBg: 'gradient-teal'
    },
    {
      id: 'feed',
      name: 'IntellMeet Room Feed',
      initials: 'IM',
      role: 'System Feed',
      isMuted: true,
      isCameraOff: false,
      isSharingScreen: false,
      avatarBg: 'gradient-purple'
    }
  ];

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="participants-panel-container">
      {/* Search Input */}
      <div className="participants-search-bar">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          type="text" 
          placeholder="Search participants..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Participants list */}
      <div className="participants-list">
        <div className="list-section-header">
          <span>In Call ({filteredParticipants.length})</span>
        </div>

        {filteredParticipants.map((p) => (
          <div className="participant-row" key={p.id}>
            <div className="participant-row-left">
              <div className={`participant-row-avatar ${p.avatarBg}`}>
                {p.initials}
              </div>
              <div className="participant-row-info">
                <span className="row-name">{p.name}</span>
                <span className="row-role">{p.role}</span>
              </div>
            </div>
            
            <div className="participant-row-right">
              {/* Screen Sharing Indicator */}
              {p.isSharingScreen && (
                <span className="screen-share-badge-pill" title="Sharing Screen">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </span>
              )}

              {/* Camera Indicator */}
              <span className={`status-icon-badge ${p.isCameraOff ? 'status-disabled' : 'status-enabled'}`} title={p.isCameraOff ? "Camera Off" : "Camera On"}>
                {p.isCameraOff ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                )}
              </span>

              {/* Mic Indicator */}
              <span className={`status-icon-badge ${p.isMuted ? 'status-disabled' : 'status-enabled'}`} title={p.isMuted ? "Microphone Muted" : "Microphone Active"}>
                {p.isMuted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
