import React, { useState } from 'react';
import './AiNotesPanel.css';

export default function AiNotesPanel({ meeting, user }) {
  const meetingTitle = meeting?.title || "Collaboration Session";
  const safeUser = user || { name: "Admin" };
  const initials = safeUser.name ? safeUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : "IA";

  // Local state to make action items checkable/interactive
  const [tasks, setTasks] = useState([
    { id: 1, text: `${initials}: Complete validation check routines for "${meetingTitle}".`, completed: false },
    { id: 2, text: "Sarah: Draft comprehensive verification test cases.", completed: false }
  ]);

  const toggleTask = (id) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="ainotes-panel-container">
      <div className="ainotes-panel-header">
        <span className="panel-title">🤖 AI Assistant Notes</span>
      </div>

      <div className="ainotes-scroller">
        {/* Highlight Section */}
        <div className="ainotes-item border-left-blue">
          <div className="note-header">
            <span className="note-icon">🎙️</span>
            <h5>Real-time Transcript Highlight</h5>
          </div>
          <p className="note-quote">"Ensure database schema models for '${meetingTitle}' support robust, real-time sync fields..."</p>
        </div>

        {/* Discussion Points Section */}
        <div className="ainotes-item border-left-purple">
          <div className="note-header">
            <span className="note-icon">🗣️</span>
            <h5>Key Discussion Point</h5>
          </div>
          <p className="note-desc">Discussed operational milestones and API parameters related to "${meetingTitle}".</p>
        </div>

        {/* Action Items Section */}
        <div className="ainotes-item border-left-green">
          <div className="note-header">
            <span className="note-icon">✅</span>
            <h5>Action Items</h5>
          </div>
          <ul className="action-items-list">
            {tasks.map(task => (
              <li key={task.id} className={`action-item-row ${task.completed ? 'completed' : ''}`} onClick={() => toggleTask(task.id)}>
                <span className="checkbox-icon">
                  {task.completed ? (
                    <svg className="checked-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <span className="checkbox-empty" />
                  )}
                </span>
                <span className="action-text">{task.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
