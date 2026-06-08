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

  return (
    <div className="room-video-area">
      <div className="video-area-grid">
        {participants.map((p) => (
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
