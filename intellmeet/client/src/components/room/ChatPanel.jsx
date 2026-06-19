import React from 'react';
import './ChatPanel.css';

export default function ChatPanel({
  messages = [],
  inputMsg = '',
  setInputMsg,
  handleSendChat,
  chatEndRef,
  currentUserInitials = 'PM'
}) {
  // Generate a mock time representation
  const getMessageTime = (idx) => {
    // Return staggered times for mock messages, or "Just Now" for user's latest messages
    if (idx === 0) return "10:41 AM";
    if (idx === 1) return "10:42 AM";
    return "Just Now";
  };

  return (
    <div className="chat-panel-container">
      <div className="chat-panel-header">
        <span className="panel-title">Live Chat</span>
        <span className="message-count">{messages.length} messages</span>
      </div>

      <div className="chat-messages-box">
        {messages.map((msg, idx) => {
          const isUser = msg.initials === currentUserInitials;
          return (
            <div className={`chat-message-bubble ${isUser ? 'user-message' : ''}`} key={idx}>
              <div className="msg-avatar-wrapper">
                <div className="msg-avatar" style={msg.initials && (msg.initials.startsWith('http') || msg.initials.startsWith('/')) ? { padding: 0, overflow: 'hidden' } : {}}>
                  {msg.initials && (msg.initials.startsWith('http') || msg.initials.startsWith('/')) ? (
                    <img src={msg.initials} alt={msg.sender} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    msg.initials
                  )}
                </div>
              </div>
              <div className="msg-bubble-content">
                <div className="msg-meta">
                  <span className="msg-sender">{msg.sender}</span>
                  <span className="msg-time">{getMessageTime(idx)}</span>
                </div>
                <div className="msg-bubble-text-box">
                  <p className="msg-text">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendChat} className="chat-input-bar">
        <input 
          type="text" 
          placeholder="Message everyone..." 
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          className="chat-text-input"
        />
        <button type="submit" className="btn-send-message" aria-label="Send message" disabled={!inputMsg.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
