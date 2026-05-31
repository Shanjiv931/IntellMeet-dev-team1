import React, { useState } from 'react';
import './Lobby.css';

export default function Lobby({ onNavigate, user }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const safeUser = user || { name: "Guest User", role: "Guest", avatar: "GU" };

  const meetingDetails = {
    title: "Q3 Strategy Planning",
    desc: "Align on quarterly strategy timelines, review marketing outlines, and establish developer OKR matrices.",
    time: "Today, 2:00 PM - 3:00 PM (GMT+5:30)",
    host: "Product Manager",
    participants: [
      { initials: "TL", name: "Tech Lead (Alex)", active: true },
      { initials: "PM", name: "Product Manager (Jane)", active: true },
      { initials: "FE", name: "Front-end Developer (Sarah)", active: false }
    ]
  };

  const handleJoin = (e) => {
    e.preventDefault();
    onNavigate('room');
  };

  return (
    <div className="lobby-page">
      <div className="lobby-container container">
        {/* Left Side: Video Preview & Device Toggles */}
        <div className="lobby-preview-col">
          <div className="preview-box">
            {isCamOn ? (
              <div className="camera-active">
                <div className="avatar-preview">{safeUser.avatar}</div>
                <span className="preview-label">Your camera is ON</span>
              </div>
            ) : (
              <div className="camera-inactive">
                <span className="camera-off-icon">📷</span>
                <span className="preview-label">Your camera is OFF</span>
              </div>
            )}
            
            {/* Overlay indicators */}
            <div className="status-indicators">
              <span className={`status-badge-icon ${isMicOn ? 'active' : 'muted'}`}>
                {isMicOn ? '🎤' : '🎙️'}
              </span>
              <span className={`status-badge-icon ${isSpeakerOn ? 'active' : 'muted'}`}>
                {isSpeakerOn ? '🔊' : '🔇'}
              </span>
            </div>
          </div>

          <div className="device-controls">
            <button 
              className={`control-circle-btn ${isMicOn ? 'active' : 'muted'}`} 
              onClick={() => setIsMicOn(!isMicOn)}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? '🎤' : '🎙️'}
            </button>
            <button 
              className={`control-circle-btn ${isCamOn ? 'active' : 'muted'}`} 
              onClick={() => setIsCamOn(!isCamOn)}
              title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isCamOn ? '📷' : '📹'}
            </button>
            <button 
              className={`control-circle-btn ${isSpeakerOn ? 'active' : 'muted'}`} 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
            >
              {isSpeakerOn ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        {/* Right Side: Meeting Details & Participants */}
        <div className="lobby-details-col">
          <div className="details-card">
            <span className="lobby-pre">Meeting Lobby</span>
            <h2>{meetingDetails.title}</h2>
            <p className="details-desc">{meetingDetails.desc}</p>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Date & Time</span>
                <span className="info-val">{meetingDetails.time}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Organized By</span>
                <span className="info-val">{meetingDetails.host}</span>
              </div>
            </div>

            <div className="participants-box">
              <h4>👥 Already in call ({meetingDetails.participants.filter(p => p.active).length})</h4>
              <div className="participants-list">
                {meetingDetails.participants.map((p, idx) => (
                  <div className="participant-row" key={idx}>
                    <div className={`p-avatar ${p.active ? 'active' : ''}`}>{p.initials}</div>
                    <span className="p-name">{p.name}</span>
                    <span className="p-status">{p.active ? 'Connected' : 'Offline'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lobby-actions">
              <button className="btn-lobby-join" onClick={handleJoin}>Join Meeting</button>
              <button className="btn-lobby-cancel" onClick={() => onNavigate('dashboard')}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
