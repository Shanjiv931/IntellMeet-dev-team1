import React, { useState } from 'react';
import './AiNotesPanel.css';

export default function AiNotesPanel() {
  // Local state to make action items checkable/interactive
  const [tasks, setTasks] = useState([
    { id: 1, text: "Alex: Finalize sprint database schema configuration.", completed: false },
    { id: 2, text: "Sarah: Draft test cases for meeting logs.", completed: false }
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
          <p className="note-quote">"Ensure Front-end modules use separate CSS stylesheets..."</p>
        </div>

        {/* Discussion Points Section */}
        <div className="ainotes-item border-left-purple">
          <div className="note-header">
            <span className="note-icon">🗣️</span>
            <h5>Key Discussion Point</h5>
          </div>
          <p className="note-desc">Discussed authentication workflow routes and validation check routines.</p>
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
