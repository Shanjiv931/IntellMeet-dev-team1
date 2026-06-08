import React from 'react';

export default function MeetingSettings({
  joinMicOn,
  setJoinMicOn,
  joinCamOn,
  setJoinCamOn,
  autoLiveCaptions,
  setAutoLiveCaptions,
  defaultDuration,
  setDefaultDuration,
  recordingPref,
  setRecordingPref,
  handleSaveSettings
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Meeting Preferences</h2>
        <p>Define standard configuration values for starting or scheduling sessions.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveSettings('meetings', {
          joinMicOn,
          joinCamOn,
          autoLiveCaptions,
          defaultDuration,
          recordingPreference: recordingPref
        });
      }} className="settings-form">
        <div className="settings-card">
          <div className="options-stack">
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Join with microphone active</strong>
                <span className="option-description">Automatically enable microphone when entering call rooms.</span>
              </div>
              <input 
                type="checkbox" 
                checked={joinMicOn} 
                onChange={(e) => setJoinMicOn(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Join with camera active</strong>
                <span className="option-description">Automatically enable camera stream when entering call rooms.</span>
              </div>
              <input 
                type="checkbox" 
                checked={joinCamOn} 
                onChange={(e) => setJoinCamOn(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Live Captions</strong>
                <span className="option-description">Auto-enable speech-to-text transcript overlays when starting calls.</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoLiveCaptions} 
                onChange={(e) => setAutoLiveCaptions(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>

          <div className="form-grid" style={{ marginTop: '24px' }}>
            <div className="form-group">
              <label className="form-label">Default Duration (minutes)</label>
              <input 
                type="number" 
                value={defaultDuration} 
                onChange={(e) => setDefaultDuration(Number(e.target.value))} 
                required
                min="5"
                className="settings-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Auto-Recording Mode</label>
              <select 
                value={recordingPref} 
                onChange={(e) => setRecordingPref(e.target.value)} 
                className="settings-select"
              >
                <option value="cloud">Cloud Backup (Recommended)</option>
                <option value="local">Local Only</option>
                <option value="none">Disabled</option>
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save Meeting Prefs</button>
          </div>
        </div>
      </form>
    </div>
  );
}
