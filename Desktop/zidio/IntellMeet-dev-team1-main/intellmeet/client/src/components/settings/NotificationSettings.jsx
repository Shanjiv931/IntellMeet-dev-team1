import React from 'react';

export default function NotificationSettings({
  emailNotif,
  setEmailNotif,
  meetingReminders,
  setMeetingReminders,
  taskReminders,
  setTaskReminders,
  aiSummaryNotif,
  setAiSummaryNotif,
  handleSaveSettings
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>Notification Settings</h2>
        <p>Customize email and push notification trigger events.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveSettings('notifications', {
          emailNotifications: emailNotif,
          meetingReminders,
          taskReminders,
          aiSummaryNotifications: aiSummaryNotif
        });
      }} className="settings-form">
        <div className="settings-card">
          <div className="options-stack">
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Email Notifications</strong>
                <span className="option-description">Receive system digest emails, updates, and invitations.</span>
              </div>
              <input 
                type="checkbox" 
                checked={emailNotif} 
                onChange={(e) => setEmailNotif(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Meeting Reminders</strong>
                <span className="option-description">Alert me via notification when a scheduled meeting is about to start.</span>
              </div>
              <input 
                type="checkbox" 
                checked={meetingReminders} 
                onChange={(e) => setMeetingReminders(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Task Assignments</strong>
                <span className="option-description">Send alerts when I'm assigned or updated on Kanban boards.</span>
              </div>
              <input 
                type="checkbox" 
                checked={taskReminders} 
                onChange={(e) => setTaskReminders(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">AI Summaries & Transcripts</strong>
                <span className="option-description">Notify me as soon as a meeting transcript finishes processing.</span>
              </div>
              <input 
                type="checkbox" 
                checked={aiSummaryNotif} 
                onChange={(e) => setAiSummaryNotif(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save Notifications</button>
          </div>
        </div>
      </form>
    </div>
  );
}
