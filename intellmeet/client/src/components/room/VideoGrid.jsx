import React from 'react';
import VideoCard from './VideoCard';
import './VideoGrid.css';

export default function VideoGrid({ user, isMuted, isCameraOff, isSharingScreen }) {
  // Define participant configuration
  const participants = [
    {
      id: 'alex',
      name: 'Tech Lead (Alex)',
      initials: 'TL',
      isActiveSpeaker: true,
      isMuted: false,
      isCameraOff: false,
      avatarBg: 'bg-blue',
      isLocalUser: false,
      isScreenShare: false
    },
    {
      id: 'sarah',
      name: 'QA Lead (Sarah)',
      initials: 'QA',
      isActiveSpeaker: false,
      isMuted: false,
      isCameraOff: false,
      avatarBg: 'bg-teal',
      isLocalUser: false,
      isScreenShare: false
    },
    // Screen share replaces/transforms the room feed
    isSharingScreen 
      ? {
          id: 'localScreen',
          name: 'You (Screen Share)',
          initials: user.avatar,
          isActiveSpeaker: false,
          isMuted: false,
          isCameraOff: false,
          avatarBg: 'bg-purple',
          isLocalUser: true,
          isScreenShare: true
        }
      : {
          id: 'roomFeed',
          name: 'IntellMeet Room Feed',
          initials: 'IM',
          isActiveSpeaker: false,
          isMuted: true,
          isCameraOff: false,
          avatarBg: 'bg-purple',
          isLocalUser: false,
          isScreenShare: false
        },
    {
      id: 'localUser',
      name: `You (${user.name})`,
      initials: user.avatar,
      isActiveSpeaker: false,
      isMuted: isMuted,
      isCameraOff: isCameraOff,
      avatarBg: 'bg-primary',
      isLocalUser: true,
      isScreenShare: false
    }
  ];

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
          />
        ))}
      </div>
    </div>
  );
}
