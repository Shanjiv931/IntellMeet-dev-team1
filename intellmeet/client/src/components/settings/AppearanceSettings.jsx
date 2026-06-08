import React from 'react';

export default function AppearanceSettings({
  theme,
  setTheme,
  compactMode,
  setCompactMode,
  fontSize,
  setFontSize,
  handleSaveSettings
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Appearance Settings</h2>
        <p>Personalize themes, layouts, and textual hierarchy scaling.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveSettings('appearance', {
          theme,
          compactMode,
          fontSize
        });
      }} className="settings-form">
        <div className="settings-card">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Theme Mode</label>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                className="settings-select"
              >
                <option value="dark">Vibrant Obsidian (Dark)</option>
                <option value="light">Prism Slate (Light)</option>
                <option value="system">Follow Operating System</option>
              </select>
              <span className="input-helper">Dark mode is optimized to minimize eye strain.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Layout Density</label>
              <div className="checkbox-control-wrapper">
                <label className="checkbox-label-row">
                  <input 
                    type="checkbox" 
                    checked={compactMode} 
                    onChange={(e) => setCompactMode(e.target.checked)} 
                    className="checkbox-input"
                  />
                  <span>Enable Compact Mode</span>
                </label>
              </div>
              <span className="input-helper">Reduces margins, padding, and spacing to pack more details.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Font Scale</label>
              <select 
                value={fontSize} 
                onChange={(e) => setFontSize(e.target.value)} 
                className="settings-select"
              >
                <option value="small">Small (Clean/Compact)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="large">Large (High Readability)</option>
              </select>
              <span className="input-helper">Scale dashboard text across headings and content pages.</span>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save Appearance</button>
          </div>
        </div>
      </form>
    </div>
  );
}
