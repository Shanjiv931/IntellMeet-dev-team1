import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './AiNotesPanel.css';

export default function AiNotesPanel({ meeting, user, transcriptHistory = [] }) {
  const meetingTitle = meeting?.title || "Collaboration Session";
  const meetingId = meeting?._id || meeting?.id;

  const [aiSummary, setAiSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing summary/action items if already present in the active meeting object
  useEffect(() => {
    if (meeting) {
      setAiSummary(meeting.summary || '');
      setKeyPoints(meeting.keyDiscussionPoints || []);
      setActionItems(meeting.actionItems || []);
    }
  }, [meeting]);

  const handleGenerateSummary = async () => {
    if (!meetingId) {
      setError('Meeting ID is missing.');
      return;
    }

    const transcript = transcriptHistory.join('\n');
    if (!transcript.trim()) {
      setError('No transcript speech has been recorded yet in this room.');
      return;
    }

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
        <span className="panel-title">🤖 AI Assistant Notes</span>
      </div>

      <div className="ainotes-scroller">
        {/* On-Demand Generate Button */}
        <div className="ainotes-action-section">
          <button 
            className="btn-generate-ai"
            onClick={handleGenerateSummary}
            disabled={loading || transcriptHistory.length === 0}
          >
            {loading ? 'Synthesizing with Gemini...' : '✨ Generate AI Summary'}
          </button>
          {transcriptHistory.length === 0 && !aiSummary && (
            <p className="no-transcript-hint">
              Speak or enable mic live captions to collect transcript logs before compiling AI summary.
            </p>
          )}
        </div>

        {error && (
          <div className="ainotes-error-msg">
            ⚠️ {error}
          </div>
        )}

        {/* Executive Summary Section */}
        {(aiSummary || loading) && (
          <div className="ainotes-item border-left-blue">
            <div className="note-header">
              <span className="note-icon">🎙️</span>
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
            <div className="note-header">
              <span className="note-icon">🗣️</span>
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
            <div className="note-header">
              <span className="note-icon">✅</span>
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
