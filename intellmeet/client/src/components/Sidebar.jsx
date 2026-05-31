import React, { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({ onNavigate, onLogout, currentTab, setCurrentTab }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'meetings', name: 'Meetings', icon: '🎥' },
    { id: 'summaries', name: 'AI Summaries', icon: '🤖' },
    { id: 'integrations', name: 'Integrations', icon: '🔌' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#2563EB"/>
          <path d="M10 12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V20C22 21.1046 21.1046 22 20 22H12C10.8954 22 10 21.1046 10 20V12Z" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="#2563EB"/>
          <path d="M22 14L25.1464 12.4268C25.7766 12.1117 26.5 12.5692 26.5 13.2736V18.7264C26.5 19.4308 25.7766 19.8883 25.1464 19.5732L22 18V14Z" fill="white"/>
        </svg>
        <span className="logo-text">IntellMeet</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-link ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-name">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={onLogout}>
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-name">Logout</span>
        </button>
      </div>
    </aside>
  );
}
