import React from 'react';

export default function SecuritySettings({
  twoFactorEnabled,
  setTwoFactorEnabled,
  twoFactorMethod,
  setTwoFactorMethod,
  shareAnalytics,
  setShareAnalytics,
  publicProfile,
  setPublicProfile,
  handleSaveSettings
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Security & Privacy Center</h2>
        <p>Protect account assets with multi-factor authentication and strict access controls.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveSettings('security', {
          twoFactorEnabled,
          twoFactorMethod,
          privacyControls: {
            shareAnalytics,
            publicProfile
          }
        });
      }} className="settings-form">
        <div className="settings-card">
          <h3>Two-Factor Authentication (2FA)</h3>
          <div className="options-stack" style={{ marginBottom: '24px' }}>
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Enable 2FA Protection</strong>
                <span className="option-description">Enforce verification checks on system login requests.</span>
              </div>
              <input 
                type="checkbox" 
                checked={twoFactorEnabled} 
                onChange={(e) => setTwoFactorEnabled(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>

          <div className="form-grid" style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Authentication Method</label>
              <select 
                value={twoFactorMethod} 
                onChange={(e) => setTwoFactorMethod(e.target.value)} 
                className="settings-select"
                disabled={!twoFactorEnabled}
              >
                <option value="none">Select Option</option>
                <option value="app">Authenticator App (TOTP)</option>
                <option value="sms">SMS Text Verification</option>
                <option value="email">Email Secure PIN</option>
              </select>
            </div>
          </div>

          <h3>Privacy Controls</h3>
          <div className="options-stack">
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Telemetry & Diagnostics</strong>
                <span className="option-description">Share anonymous analytics reports to improve audio latency and processing speed.</span>
              </div>
              <input 
                type="checkbox" 
                checked={shareAnalytics} 
                onChange={(e) => setShareAnalytics(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Public Directory Profile</strong>
                <span className="option-description">Allow external teams to find and invite my profile using email lookup queries.</span>
              </div>
              <input 
                type="checkbox" 
                checked={publicProfile} 
                onChange={(e) => setPublicProfile(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save Security Settings</button>
          </div>
        </div>
      </form>
    </div>
  );
}
