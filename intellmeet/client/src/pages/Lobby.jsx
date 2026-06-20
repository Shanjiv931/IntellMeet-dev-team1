import React, { useState, useEffect, useRef } from 'react';
import './Lobby.css';

export default function Lobby({ onNavigate, user: _user, meeting }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [volume, setVolume] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);


  const meetingTitle = meeting?.title || "Instant Sync Session";
  const meetingDesc = meeting?.description || "Align on quarterly strategy timelines, review marketing outlines, and establish developer OKR matrices.";
  const meetingTime = meeting?.startTime 
    ? new Date(meeting.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
    : "Today, 2:00 PM - 3:00 PM (GMT+5:30)";
  const meetingHost = meeting?.host?.name || "Organizing Host";

  const activeParticipants = meeting?.participants || [];

  useEffect(() => {
    let activeStream = null;

    const startStream = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        if (isCamOn || isMicOn) {
          const constraints = {
            video: isCamOn ? { width: 1280, height: 720 } : false,
            audio: isMicOn
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          activeStream = stream;
          streamRef.current = stream;
          setLocalStream(stream);

          if (videoRef.current && isCamOn) {
            videoRef.current.srcObject = stream;
          }
        } else {
          setLocalStream(null);
          streamRef.current = null;
        }
      } catch (err) {
        console.error("Lobby media access failed:", err);
      }
    };

    startStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isCamOn, isMicOn]);

  useEffect(() => {
    if (!isMicOn || !localStream) {
      setVolume(0);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioContext;
    let analyser;
    let source;
    let animationFrameId;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source = audioContext.createMediaStreamSource(localStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(Math.min(Math.round((average / 100) * 100), 100));
        animationFrameId = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("Lobby audio context setup error:", err);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [isMicOn, localStream]);

  const handleJoin = (e) => {
    e.preventDefault();
    localStorage.setItem('intellmeet_lobby_mic', isMicOn ? 'on' : 'off');
    localStorage.setItem('intellmeet_lobby_cam', isCamOn ? 'on' : 'off');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onNavigate('room', meeting);
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onNavigate('dashboard');
  };

  return (
    <div className="lobby-page">
      <div className="lobby-container container">
        {/* Left Side: Video Preview & Device Toggles */}
        <div className="lobby-preview-col">
          <div className="preview-box">
            {isCamOn && localStream && localStream.getVideoTracks().length > 0 ? (
              <div className="camera-active" style={{ width: '100%', height: '100%' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    transform: 'scaleX(-1)'
                  }} 
                />
              </div>
            ) : (
              <div className="camera-inactive">
                <span className="camera-off-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34M23 7l-7 5 7 5V7zM1 1l22 22"/></svg>
                </span>
                <span className="preview-label">Your camera is OFF</span>
              </div>
            )}
            
            {/* Overlay indicators */}
            <div className="status-indicators" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`status-badge-icon ${isMicOn ? 'active' : 'muted'}`}>
                {isMicOn ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 11a7 7 0 0 1-2.29 5.12M19 10v2a7 7 0 0 1-1-3.5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
              </span>
              {isMicOn && (
                <div className="mic-volume-meter" style={{ display: 'flex', gap: '3px', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 8px', borderRadius: '12px' }}>
                  <div style={{ width: '3px', height: `${Math.max(4, volume * 0.15)}px`, background: '#10B981', transition: 'height 0.1s ease', borderRadius: '1px' }}></div>
                  <div style={{ width: '3px', height: `${Math.max(4, volume * 0.25)}px`, background: '#10B981', transition: 'height 0.1s ease', borderRadius: '1px' }}></div>
                  <div style={{ width: '3px', height: `${Math.max(4, volume * 0.15)}px`, background: '#10B981', transition: 'height 0.1s ease', borderRadius: '1px' }}></div>
                </div>
              )}
              <span className={`status-badge-icon ${isSpeakerOn ? 'active' : 'muted'}`}>
                {isSpeakerOn ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                )}
              </span>
            </div>
          </div>

          <div className="device-controls">
            <button 
              className={`control-circle-btn ${isMicOn ? 'active' : 'muted'}`} 
              onClick={() => setIsMicOn(!isMicOn)}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 11a7 7 0 0 1-2.29 5.12M19 10v2a7 7 0 0 1-1-3.5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              )}
            </button>
            <button 
              className={`control-circle-btn ${isCamOn ? 'active' : 'muted'}`} 
              onClick={() => setIsCamOn(!isCamOn)}
              title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isCamOn ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34M23 7l-7 5 7 5V7zM1 1l22 22"/></svg>
              )}
            </button>
            <button 
              className={`control-circle-btn ${isSpeakerOn ? 'active' : 'muted'}`} 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
            >
              {isSpeakerOn ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Meeting Details & Participants */}
        <div className="lobby-details-col">
          <div className="details-card">
            <span className="lobby-pre">Meeting Lobby</span>
            <h2>{meetingTitle}</h2>
            <p className="details-desc">{meetingDesc}</p>

            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Date & Time</span>
                <span className="info-val">{meetingTime}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Organized By</span>
                <span className="info-val">{meetingHost}</span>
              </div>
            </div>

            <div className="participants-box">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Already in call ({activeParticipants.length})
              </h4>
              <div className="participants-list">
                {activeParticipants.length === 0 ? (
                  <p className="no-participants" style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic', padding: '8px 0' }}>
                    No other participants in call yet.
                  </p>
                ) : (
                  activeParticipants.map((p, idx) => {
                    const pName = typeof p === 'object' ? (p.name || 'Anonymous User') : 'User';
                    const pInitials = typeof p === 'object' ? (p.avatar || pName.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()) : 'U';
                    const hasImage = pInitials.startsWith('http') || pInitials.startsWith('/');
                    return (
                      <div className="participant-row" key={p._id || p.id || idx}>
                        <div className="p-avatar active" style={hasImage ? { padding: 0, overflow: 'hidden' } : {}}>
                          {hasImage ? (
                            <img src={pInitials} alt={pName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            pInitials
                          )}
                        </div>
                        <span className="p-name">{pName}</span>
                        <span className="p-status">Connected</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lobby-actions">
              <button className="btn-lobby-join" onClick={handleJoin}>Join Meeting</button>
              <button className="btn-lobby-cancel" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
