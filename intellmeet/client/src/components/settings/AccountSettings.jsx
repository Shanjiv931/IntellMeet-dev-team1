import React from 'react';

export default function AccountSettings({
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handlePasswordChange,
  sessions,
  handleLogoutAllOtherDevices,
  handleTerminateSession,
  handleDeleteAccount
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Account Settings</h2>
        <p>Update passwords, view device login history, or terminate active sessions.</p>
      </div>
      
      {/* Change Password Card */}
      <div className="settings-card">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required 
                className="settings-input"
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                className="settings-input"
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="settings-input"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Rotate Password</button>
          </div>
        </form>
      </div>

      {/* Sessions Activity Card */}
      <div className="settings-card">
        <div className="card-header-flex">
          <div>
            <h3>Active Login Sessions</h3>
            <p className="card-subtitle">Manage device access logs connected to your credential tokens.</p>
          </div>
          <button 
            type="button" 
            onClick={handleLogoutAllOtherDevices} 
            className="btn-settings-outline"
          >
            Sign out other devices
          </button>
        </div>
        
        <div className="sessions-list">
          {sessions.map((sess) => (
            <div key={sess._id} className="session-item">
              <div className="session-details">
                <div className="session-header-row">
                  <span className="session-device">{sess.device || 'Unknown Device'}</span>
                  {sess.token === localStorage.getItem('token') && (
                    <span className="badge-active-session">Current Session</span>
                  )}
                </div>
                <div className="session-meta">
                  <span>IP: {sess.ipAddress || '127.0.0.1'}</span>
                  <span className="meta-dot">•</span>
                  <span>Last active: {new Date(sess.lastActive).toLocaleString()}</span>
                </div>
              </div>
              {sess.token !== localStorage.getItem('token') && (
                <button 
                  type="button" 
                  onClick={() => handleTerminateSession(sess._id)} 
                  className="btn-revoke-session"
                  title="Terminate session"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Account Card */}
      <div className="settings-card border-danger">
        <h3 className="text-danger">Danger Zone</h3>
        <p className="card-subtitle">Once you delete your account, there is no going back. All summaries, tasks, and meetings will be deleted permanently.</p>
        <div className="danger-zone-actions">
          <button 
            type="button" 
            onClick={handleDeleteAccount} 
            className="btn-settings-danger"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
