import React from 'react';
import './DashboardNavbar.css';

export default function DashboardNavbar({ user, onLogout, searchQuery, setSearchQuery }) {
  const safeUser = user || { name: "Guest User", role: "Guest", avatar: "GU" };
  return (
    <header className="db-navbar">
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
        <button className="btn-icon" aria-label="Notifications">
          🔔
          <span className="btn-badge">3</span>
        </button>
        <div className="user-profile">
          <div className="user-avatar">{safeUser.avatar}</div>
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
