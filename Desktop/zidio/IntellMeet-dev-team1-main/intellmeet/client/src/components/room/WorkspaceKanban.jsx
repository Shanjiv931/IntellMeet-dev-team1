import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import './WorkspaceKanban.css';

const COLUMNS = [
  { id: 'TODO', title: 'Todo', color: '#3b82f6' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#f59e0b' },
  { id: 'REVIEW', title: 'Review', color: '#8b5cf6' },
  { id: 'DONE', title: 'Done', color: '#10b981' }
];

export default function WorkspaceKanban({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAssigneeName, setFormAssigneeName] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formColumn, setFormColumn] = useState('TODO');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Failed to load Kanban tasks:', err);
      setError('Could not retrieve workspace tasks from database.');
    } finally {
      setLoading(false);
    }
  };

  // Connect to Kanban socket channel
  useEffect(() => {
    fetchTasks();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://intellmeet-backend-5j5a.onrender.com';
    console.log('Connecting to Kanban Sockets Gateway:', socketUrl);
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Joined real-time Kanban room connection.');
      socket.emit('join-kanban');
    });

    socket.on('kanban-task-created', (task) => {
      setTasks(prev => {
        if (prev.some(t => (t._id || t.id) === (task._id || task.id))) return prev;
        return [...prev, task];
      });
    });

    socket.on('kanban-task-updated', (updatedTask) => {
      setTasks(prev => prev.map(t => 
        (t._id || t.id) === (updatedTask._id || updatedTask.id) ? updatedTask : t
      ));
    });

    socket.on('kanban-task-deleted', (taskId) => {
      setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const taskToMove = tasks.find(t => (t._id || t.id) === taskId);
    if (!taskToMove || taskToMove.status === targetColumn) return;

    // Optimistic Update
    const previousTasks = [...tasks];
    const updatedTask = { ...taskToMove, status: targetColumn };
    
    setTasks(prev => prev.map(t => 
      (t._id || t.id) === taskId ? updatedTask : t
    ));

    try {
      const response = await api.put(`/tasks/${taskId}`, { status: targetColumn });
      if (response.success) {
        // Emit Socket Update
        if (socketRef.current) {
          socketRef.current.emit('kanban-task-updated', response.data.task);
        }
      } else {
        setTasks(previousTasks);
      }
    } catch (err) {
      console.error('Failed to update task column drop:', err);
      setTasks(previousTasks);
    }
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Task title is required.');
      return;
    }

    try {
      const response = await api.post('/tasks', {
        title: formTitle,
        description: formDesc,
        status: formColumn,
        assigneeName: formAssigneeName,
        dueDate: formDueDate || null
      });

      if (response.success) {
        const newTask = response.data.task;
        setTasks(prev => [...prev, newTask]);

        // Emit Socket Event
        if (socketRef.current) {
          socketRef.current.emit('kanban-task-created', newTask);
        }

        // Close Modal & Reset
        setIsModalOpen(false);
        setFormTitle('');
        setFormDesc('');
        setFormAssigneeName('');
        setFormDueDate('');
      }
    } catch (err) {
      alert('Failed to create task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));

    try {
      await api.delete(`/tasks/${taskId}`);
      if (socketRef.current) {
        socketRef.current.emit('kanban-task-deleted', taskId);
      }
    } catch (err) {
      console.error('Delete task failed:', err);
      setTasks(previousTasks);
      alert('Could not delete task: ' + err.message);
    }
  };

  const openAddTaskModal = (columnId) => {
    setFormColumn(columnId);
    setIsModalOpen(true);
  };

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = task.title?.toLowerCase().includes(query);
    const assigneeMatch = task.assigneeName?.toLowerCase().includes(query) || 
                          task.assignee?.name?.toLowerCase().includes(query);
    return titleMatch || assigneeMatch;
  });

  return (
    <div className="kanban-workspace-container">
      {/* Top Header Actions */}
      <div className="kanban-workspace-header">
        <div>
          <h2>👥 Team Workspace</h2>
          <p>Collaborative Kanban Board with real-time sync and action checklist tracking.</p>
        </div>
        
        <div className="header-controls">
          <input 
            type="text" 
            placeholder="🔍 Search tasks by title or assignee..." 
            className="search-input-kanban"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn-add-task-global" onClick={() => openAddTaskModal('TODO')}>
            ➕ Create Task
          </button>
        </div>
      </div>

      {error && <div className="kanban-error">{error}</div>}

      {/* Board Columns Container */}
      {loading ? (
        <div className="kanban-loading">Loading collaborative board status...</div>
      ) : (
        <div className="kanban-board-grid">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            
            return (
              <div 
                key={col.id} 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="column-header" style={{ borderTop: `4px solid ${col.color}` }}>
                  <div className="column-header-info">
                    <span className="column-dot" style={{ backgroundColor: col.color }} />
                    <h3>{col.title}</h3>
                  </div>
                  <span className="column-count-badge">{colTasks.length}</span>
                </div>

                <div className="tasks-cards-container">
                  {colTasks.map(task => {
                    const id = task._id || task.id;
                    const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                    
                    return (
                      <div 
                        key={id}
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="task-card-header">
                          <h4 className="task-title">{task.title}</h4>
                          <button className="btn-delete-task" onClick={() => handleDeleteTask(id)} title="Delete Task">
                            ✕
                          </button>
                        </div>

                        {task.description && <p className="task-desc">{task.description}</p>}

                        <div className="task-card-footer">
                          {/* Assignee Badge */}
                          <div className="task-assignee">
                            <span className="assignee-avatar">
                              {task.assignee?.name 
                                ? task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                : task.assigneeName ? task.assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '👤'}
                            </span>
                            <span className="assignee-name" title={task.assignee?.name || task.assigneeName}>
                              {task.assignee?.name || task.assigneeName || 'Unassigned'}
                            </span>
                          </div>

                          {/* Due Date */}
                          {dateStr && (
                            <span className="task-due-date" title="Due Date">
                              📅 {dateStr}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {colTasks.length === 0 && (
                    <div className="empty-column-placeholder">
                      Drag tasks here
                    </div>
                  )}
                </div>

                <button className="btn-add-task-column" onClick={() => openAddTaskModal(col.id)}>
                  ➕ Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal Dialog */}
      {isModalOpen && (
        <div className="kanban-modal-backdrop">
          <div className="kanban-modal-box">
            <h3>✨ Create New Kanban Task</h3>
            <form onSubmit={handleCreateTaskSubmit} className="kanban-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter task title..." 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  placeholder="Task details and scope..." 
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assignee Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Designer or Team member..." 
                    value={formAssigneeName}
                    onChange={(e) => setFormAssigneeName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
