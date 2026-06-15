import React from 'react';
import VideoCard from './VideoCard';
import './VideoGrid.css';

export default function VideoGrid({ 
  user, 
  isMuted, 
  isCameraOff, 
  isSharingScreen,
  localStream = null,
  screenStream = null,
  peersList = [],
  remoteStreams = {}
}) {
  const participants = [];

  // 1. Add Local User Feed
  participants.push({
    id: 'localUser',
    name: `You (${user.name})`,
    initials: user.avatar,
    isActiveSpeaker: false,
    isMuted: isMuted,
    isCameraOff: isCameraOff,
    avatarBg: 'bg-primary',
    isLocalUser: true,
    isScreenShare: false,
    stream: localStream
  });

  // 2. Add Local Screen Share Feed if active
  if (isSharingScreen && screenStream) {
    participants.push({
      id: 'localScreen',
      name: 'You (Screen Share)',
      initials: user.avatar,
      isActiveSpeaker: false,
      isMuted: false,
      isCameraOff: false,
      avatarBg: 'bg-purple',
      isLocalUser: true,
      isScreenShare: true,
      stream: screenStream
    });
  }

  // 3. Add Remote Peers dynamically
  peersList.forEach(peerId => {
    participants.push({
      id: peerId,
      name: `Peer (${peerId.slice(0, 5)})`,
      initials: 'P',
      isActiveSpeaker: false,
      isMuted: false,
      isCameraOff: false,
      avatarBg: 'bg-blue',
      isLocalUser: false,
      isScreenShare: false,
      stream: remoteStreams[peerId] || null
    });
  });

  // No mock/default participants added to grid
  const showScalingBanner = peersList.length > 4;
  const renderedParticipants = participants.slice(0, 6);
  const hiddenCount = participants.length - renderedParticipants.length;

  return (
    <div className="room-video-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {showScalingBanner && (
        <div className="enterprise-scaling-banner" style={{
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          color: '#3b82f6',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
          margin: '0 8px 8px 8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Enterprise Broadcast Mode Active (Capped grid view for 5,000+ participants)</span>
          </div>
          {hiddenCount > 0 && (
            <span style={{ fontSize: '11px', backgroundColor: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
              +{hiddenCount} others in call
            </span>
          )}
        </div>
      )}
      
      <div className="video-area-grid" style={{ flex: 1 }}>
        {renderedParticipants.map((p) => (
          <VideoCard
            key={p.id}
            name={p.name}
            initials={p.initials}
            isActiveSpeaker={p.isActiveSpeaker}
            isMuted={p.isMuted}
            isCameraOff={p.isCameraOff}
            isLocalUser={p.isLocalUser}
            isScreenShare={p.isScreenShare}
            avatarBg={p.avatarBg}
            stream={p.stream}
          />
        ))}
      </div>
    </div>
  );
}
