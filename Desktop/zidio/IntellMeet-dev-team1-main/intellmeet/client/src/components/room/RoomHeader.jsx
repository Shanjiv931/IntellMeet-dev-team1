import React from 'react';
import './RoomHeader.css';

export default function RoomHeader({ title = "Q3 Strategy Planning", seconds = 0, formatTimer }) {
  const defaultFormatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const timerString = formatTimer ? formatTimer(seconds) : defaultFormatTimer(seconds);

  return (
    <header className="room-header">
      <div className="header-left">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#2563EB"/>
            <path d="M10 12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V20C22 21.1046 21.1046 22 20 22H12C10.8954 22 10 21.1046 10 20V12Z" fill="white"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB"/>
            <path d="M22 14L25.1464 12.4268C25.7766 12.1117 26.5 12.5692 26.5 13.2736V18.7264C26.5 19.4308 25.7766 19.8883 25.1464 19.5732L22 18V14Z" fill="white"/>
          </svg>
        </div>
        <div className="room-title-section">
          <h1 className="room-title">{title}</h1>
          <div className="recording-status">
            <span className="pulse-dot"></span>
            <span className="status-label">Live Recording</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="timer-badge">
          <svg className="timer-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="timer-count">{timerString}</span>
        </div>
      </div>
    </header>
  );
}
