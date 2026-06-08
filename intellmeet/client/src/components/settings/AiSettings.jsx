import React from 'react';

export default function AiSettings({
  enableAiSummaries,
  setEnableAiSummaries,
  enableActionItems,
  setEnableActionItems,
  enableLiveTranscription,
  setEnableLiveTranscription,
  aiLanguage,
  setAiLanguage,
  handleSaveSettings
}) {
  return (
    <div className="settings-pane animate-fade-in">
      <div className="pane-header">
        <h2>AI Intelligence Preferences</h2>
        <p>Manage GPT-4o voice recognition, summaries, and action checks.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveSettings('ai', {
          enableAiSummaries,
          enableActionItems,
          enableLiveTranscription,
          aiLanguage
        });
      }} className="settings-form">
        <div className="settings-card">
          <div className="options-stack">
            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">AI Summarizations</strong>
                <span className="option-description">Distill voice recordings into core meeting briefs.</span>
              </div>
              <input 
                type="checkbox" 
                checked={enableAiSummaries} 
                onChange={(e) => setEnableAiSummaries(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Action Item Extraction</strong>
                <span className="option-description">Automatically compile follow-up tasks from discussion transcripts.</span>
              </div>
              <input 
                type="checkbox" 
                checked={enableActionItems} 
                onChange={(e) => setEnableActionItems(e.target.checked)} 
                className="switch-input"
              />
            </label>

            <label className="option-toggle-row">
              <div className="option-info">
                <strong className="option-title">Real-time Audio Transcription</strong>
                <span className="option-description">Transcribe voice paths continuously during online sessions.</span>
              </div>
              <input 
                type="checkbox" 
                checked={enableLiveTranscription} 
                onChange={(e) => setEnableLiveTranscription(e.target.checked)} 
                className="switch-input"
              />
            </label>
          </div>

          <div className="form-grid" style={{ marginTop: '24px' }}>
            <div className="form-group">
              <label className="form-label">Acoustic Speech Language</label>
              <select 
                value={aiLanguage} 
                onChange={(e) => setAiLanguage(e.target.value)} 
                className="settings-select"
              >
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish (Spain)</option>
                <option value="fr-FR">French (France)</option>
                <option value="de-DE">German (Germany)</option>
                <option value="zh-CN">Chinese (Simplified)</option>
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-settings-save">Save AI Prefs</button>
          </div>
        </div>
      </form>
    </div>
  );
}
