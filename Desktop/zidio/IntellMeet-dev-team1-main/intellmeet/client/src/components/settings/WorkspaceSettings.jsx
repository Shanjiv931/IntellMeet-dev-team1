import React from 'react';

export default function WorkspaceSettings({
  defaultWorkspace,
  setDefaultWorkspace,
  allowInvites,
  setAllowInvites,
  restrictDomain,
  setRestrictDomain,
  defaultColumn,
  setDefaultColumn,
  autoArchiveDone,
  setAutoArchiveDone,
  handleSaveSettings
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Workspace Settings</h2>
        <p>Configure workspace rules and Kanban card behaviors.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveSettings('workspace', {
          defaultWorkspace,
          teamPreferences: {
            allowInvites,
            restrictDomain
          },
          kanbanPreferences: {
            defaultColumn,
            autoArchiveDone
          }
        });
      }} className="settings-form">
        <div className="settings-card">
          <h3>General Preference</h3>
          <div className="form-grid" style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Default Landing Workspace</label>
              <input 
                type="text" 
                value={defaultWorkspace} 
                onChange={(e) => setDefaultWorkspace(e.target.value)} 
                required
                className="settings-input"
              />
            </div>
          </div>

          <h3>Team Connections</h3>
          <div className="options-stack" style={{ marginBottom: '24px' }}>
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Member Invitation Rights</strong>
                <span className="option-description">Allow active workspace members to invite external collaborators.</span>
              </div>
              <input 
                type="checkbox" 
                checked={allowInvites} 
                onChange={(e) => setAllowInvites(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>

          <div className="form-grid" style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Domain Restrict Access</label>
              <input 
                type="text" 
                value={restrictDomain} 
                onChange={(e) => setRestrictDomain(e.target.value)} 
                placeholder="e.g. company.com"
                className="settings-input"
              />
              <span className="input-helper">Only users from this domain suffix will be allowed entry. Keep blank to allow any.</span>
            </div>
          </div>

          <h3>Kanban Layout Rules</h3>
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Default Creation Column</label>
              <select 
                value={defaultColumn} 
                onChange={(e) => setDefaultColumn(e.target.value)} 
                className="settings-select"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>
            </div>
          </div>

          <div className="options-stack">
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Auto-Archive Tasks</strong>
                <span className="option-description">Instantly move board cards to history logs when dragged to the "Completed" column.</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoArchiveDone} 
                onChange={(e) => setAutoArchiveDone(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save Workspace Settings</button>
          </div>
        </div>
      </form>
    </div>
  );
}
