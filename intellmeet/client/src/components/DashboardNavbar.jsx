import React, { useState, useEffect, useRef } from 'react';
import './DashboardNavbar.css';

export default function DashboardNavbar({ 
  user, 
  onLogout, 
  searchQuery, 
  setSearchQuery,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDeleteNotification
}) {
  const safeUser = user || { name: "Guest User", role: "Guest", avatar: "GU" };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="db-navbar" ref={dropdownRef}>
      {/* Search box */}
      <div className="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Search meetings, transcripts, summaries..." 
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Top Navbar Actions */}
      <div className="db-navbar-actions">
        <div className="notifications-container">
          <button 
            className="btn-icon" 
            aria-label="Notifications"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bell-icon">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <span className="btn-badge">{unreadCount}</span>}
          </button>

          {/* Notifications Dropdown Card */}
          {isDropdownOpen && (
            <div className="notifications-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    className="btn-mark-all" 
                    onClick={() => {
                      onMarkAllNotificationsRead();
                      showToastNotification("All notifications marked as read");
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="dropdown-body">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty">
                    <p>No notifications yet</p>
                    <span>We will alert you when tasks are assigned.</span>
                  </div>
                ) : (
                  <div className="notifications-list-wrapper">
                    {notifications.map((notif) => (
                      <div 
                        key={notif._id || notif.id} 
                        className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                        onClick={() => !notif.read && onMarkNotificationRead(notif._id || notif.id)}
                      >
                        <div className="notif-content">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {!notif.read && <span className="unread-dot"></span>}
                            <h4 className="notif-title">{notif.title}</h4>
                          </div>
                          <p className="notif-message">{notif.message}</p>
                          <span className="notif-time">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button 
                          className="btn-delete-notif" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notif._id || notif.id);
                          }}
                          title="Delete Notification"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile">
          <div className="user-avatar" style={safeUser.avatar && (safeUser.avatar.startsWith('http') || safeUser.avatar.startsWith('/')) ? { padding: 0, overflow: 'hidden' } : {}}>
            {safeUser.avatar && (safeUser.avatar.startsWith('http') || safeUser.avatar.startsWith('/')) ? (
              <img src={safeUser.avatar} alt={safeUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              safeUser.avatar
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{safeUser.name}</span>
            <span className="user-role">{safeUser.role}</span>
          </div>
          <button className="btn-profile-logout" onClick={onLogout} title="Logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

// Simple internal helper for dropdown visual feedback
function showToastNotification(msg) {
  console.log(`Notification Center Event: ${msg}`);
}
