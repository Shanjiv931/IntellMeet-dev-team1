import React from 'react';

export default function ProfileSettings({
  profileAvatar,
  setProfileAvatar,
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  profileRole,
  handleProfileSave
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Profile Settings</h2>
        <p>Update your personal details, avatar, and system roles.</p>
      </div>
      <form onSubmit={handleProfileSave} className="settings-form">
        <div className="settings-card">
          <div className="avatar-upload-section">
            <div className="avatar-preview-wrapper">
              {profileAvatar ? (
                <img src={profileAvatar} alt="Avatar" className="avatar-preview-img" />
              ) : (
                <div className="avatar-preview-placeholder">
                  {profileName ? profileName.substring(0, 2).toUpperCase() : 'IM'}
                </div>
              )}
            </div>
            <div className="avatar-input-group">
              <label className="form-label">Upload Profile Picture</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="settings-input"
                style={{ padding: '6px 10px', height: 'auto' }}
              />
              <div style={{ margin: '4px 0', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 'bold' }}>- OR -</div>
              <label className="form-label">Avatar URL</label>
              <input 
                type="url" 
                value={profileAvatar && !profileAvatar.startsWith('data:') ? profileAvatar : ''} 
                onChange={(e) => setProfileAvatar(e.target.value)} 
                placeholder="https://example.com/avatar.jpg"
                className="settings-input"
              />
              <span className="input-helper">Provide a URL link or upload a custom profile picture</span>
            </div>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
                required
                className="settings-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                value={profileEmail} 
                onChange={(e) => setProfileEmail(e.target.value)} 
                required
                className="settings-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">System Role</label>
              <input 
                type="text" 
                value={profileRole} 
                readOnly 
                className="settings-input read-only-input"
              />
              <span className="input-helper">Roles can only be adjusted by system administrators.</span>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save Changes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
