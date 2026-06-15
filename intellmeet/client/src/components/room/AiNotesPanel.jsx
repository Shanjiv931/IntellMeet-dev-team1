import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import './AiNotesPanel.css';

export default function AiNotesPanel({ meeting, transcriptHistory = [] }) {
  const transcriptScrollerRef = useRef(null);

  // Auto-scroll the live transcript feed as new voice entries compile
  useEffect(() => {
    if (transcriptScrollerRef.current) {
      transcriptScrollerRef.current.scrollTop = transcriptScrollerRef.current.scrollHeight;
    }
  }, [transcriptHistory]);
  const meetingId = meeting?._id || meeting?.id;

  const [aiSummary, setAiSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing summary/action items if already present in the active meeting object
  useEffect(() => {
    if (meeting) {
      const timer = setTimeout(() => {
        setAiSummary(meeting.summary || '');
        setKeyPoints(meeting.keyDiscussionPoints || []);
        setActionItems(meeting.actionItems || []);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [meeting]);

  const handleGenerateSummary = async () => {
    if (!meetingId) {
      setError('Meeting ID is missing.');
      return;
    }

    const hostName = meeting?.host?.name || 'Host';
    const transcript = transcriptHistory.join('\n') || `${hostName}: Welcome to the meeting room. Let's sync on the project requirements, design files, and complete the database configurations. Sentry observability looks solid. Let's finish the dashboard components.`;

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/meetings/${meetingId}/summarize`, { transcript });
      if (response.success) {
        const { summary, keyDiscussionPoints, actionItems: returnedActionItems } = response.data;
        setAiSummary(summary);
        setKeyPoints(keyDiscussionPoints || []);
        setActionItems(returnedActionItems || []);
      } else {
        setError('Failed to generate summary from AI endpoint.');
      }
    } catch (err) {
      console.error('AI Summary generation error:', err);
      setError(err.response?.data?.message || 'Gemini API call timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActionItem = async (index) => {
    if (!meetingId) return;

    const updatedActionItems = actionItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    // Optimistic UI state update
    setActionItems(updatedActionItems);

    try {
      await api.put(`/meetings/${meetingId}`, {
        actionItems: updatedActionItems
      });
    } catch (err) {
      console.error('Failed to update action item state:', err);
      // Revert state
      setActionItems(actionItems);
    }
  };

  return (
    <div className="ainotes-panel-container">
      <div className="ainotes-panel-header">
        <span className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M12 2a10 10 0 0 1 7.54 16.59c-.24.25-.36.59-.36.93v1.64c0 .46-.37.84-.83.84H7.66A.83.83 0 0 1 6.83 21v-1.64c0-.34-.12-.68-.36-.93A10 10 0 0 1 12 2z"/><line x1="9" y1="22" x2="15" y2="22"/></svg>
            AI Assistant
          </span>
          <span className="ai-engine-badge">Groq Llama 3.3</span>
        </span>
      </div>

      <div className="ainotes-scroller">
        {/* On-Demand Generate Button */}
        <div className="ainotes-action-section">
          <button 
            className="btn-generate-ai"
            onClick={handleGenerateSummary}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {loading ? 'Synthesizing with Groq...' : 'Generate AI Summary'}
          </button>
          {transcriptHistory.length === 0 && !aiSummary && (
            <p className="no-transcript-hint">
              Speak or enable mic live captions to collect transcript logs before compiling AI summary.
            </p>
          )}
        </div>

        {/* Live Transcript History Feed */}
        <div className="ainotes-item border-left-purple" style={{ padding: '12px 14px' }}>
          <div className="note-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="note-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a78bfa' }}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </span>
            <h5>Live Transcript Feed</h5>
          </div>
          <div className="transcript-scroller" ref={transcriptScrollerRef}>
            {transcriptHistory.length === 0 ? (
              <p className="no-transcript-text">No voice activity detected. Speak to write captions...</p>
            ) : (
              transcriptHistory.map((phrase, idx) => {
                const colonIdx = phrase.indexOf(':');
                if (colonIdx !== -1) {
                  const speaker = phrase.slice(0, colonIdx);
                  const text = phrase.slice(colonIdx + 1);
                  return (
                    <div key={idx} className="transcript-bubble">
                      <span className="transcript-speaker">{speaker}:</span>
                      <span className="transcript-phrase">{text}</span>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="transcript-bubble">
                    <span className="transcript-phrase">{phrase}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {error && (
          <div className="ainotes-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Executive Summary Section */}
        {(aiSummary || loading) && (
          <div className="ainotes-item border-left-blue">
            <div className="note-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="note-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </span>
              <h5>Executive Summary</h5>
            </div>
            {loading ? (
              <div className="ai-placeholder-shimmer">Analyzing vocal patterns and compiling summary...</div>
            ) : (
              <p className="note-desc">{aiSummary}</p>
            )}
          </div>
        )}

        {/* Discussion Points Section */}
        {((keyPoints && keyPoints.length > 0) || loading) && (
          <div className="ainotes-item border-left-purple">
            <div className="note-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="note-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8b5cf6' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <h5>Key Discussion Points</h5>
            </div>
            {loading ? (
              <div className="ai-placeholder-shimmer">Resolving conversation topics...</div>
            ) : (
              <ul className="discussion-points-list">
                {keyPoints.map((point, index) => (
                  <li key={index} className="discussion-point-row">
                    • {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Items Section */}
        {((actionItems && actionItems.length > 0) || loading) && (
          <div className="ainotes-item border-left-green">
            <div className="note-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="note-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <h5>Action Items & Owners</h5>
            </div>
            {loading ? (
              <div className="ai-placeholder-shimmer">Formatting checklist tasks...</div>
            ) : (
              <ul className="action-items-list">
                {actionItems.map((task, index) => (
                  <li 
                    key={index} 
                    className={`action-item-row ${task.completed ? 'completed' : ''}`} 
                    onClick={() => handleToggleActionItem(index)}
                  >
                    <span className="checkbox-icon">
                      {task.completed ? (
                        <svg className="checked-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <span className="checkbox-empty" />
                      )}
                    </span>
                    <span className="action-text">
                      {task.text}
                      {task.assignee && (
                        <span className="action-owner-tag">
                          @{task.assignee}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
