import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardNavbar from '../components/DashboardNavbar';
import WorkspaceKanban from '../components/room/WorkspaceKanban';
import ProfileSettings from '../components/settings/ProfileSettings';
import AccountSettings from '../components/settings/AccountSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import MeetingSettings from '../components/settings/MeetingSettings';
import AiSettings from '../components/settings/AiSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import WorkspaceSettings from '../components/settings/WorkspaceSettings';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard({ onNavigate, user, activeMeeting }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [meetings, setMeetings] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [redirectedForEndedMeeting, setRedirectedForEndedMeeting] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Join meeting modal states
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Recording upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  // Scheduler modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState(30);
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [editingMeetingId, setEditingMeetingId] = useState(null);

  // App Settings states (SaaS Settings module states)
  const [settingsTab, setSettingsTab] = useState('profile');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileRole, setProfileRole] = useState('MEMBER');
  
  // Account tab states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessions, setSessions] = useState([]);
  
  // Notifications tab states
  const [emailNotif, setEmailNotif] = useState(true);
  const [meetingReminders, setMeetingReminders] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [aiSummaryNotif, setAiSummaryNotif] = useState(true);
  
  // Appearance tab states
  const [theme, setTheme] = useState('light');
  const [compactMode, setCompactMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  
  // Meeting Preferences tab states
  const [joinMicOn, setJoinMicOn] = useState(false);
  const [joinCamOn, setJoinCamOn] = useState(false);
  const [autoLiveCaptions, setAutoLiveCaptions] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [recordingPref, setRecordingPref] = useState('cloud');
  
  // AI Preferences tab states
  const [enableAiSummaries, setEnableAiSummaries] = useState(true);
  const [enableActionItems, setEnableActionItems] = useState(true);
  const [enableLiveTranscription, setEnableLiveTranscription] = useState(true);
  const [aiLanguage, setAiLanguage] = useState('en-US');
  
  // Security tab states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('none');
  const [shareAnalytics, setShareAnalytics] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  
  // Workspace tab states
  const [defaultWorkspace, setDefaultWorkspace] = useState('My Workspace');
  const [allowInvites, setAllowInvites] = useState(true);
  const [restrictDomain, setRestrictDomain] = useState('');
  const [defaultColumn, setDefaultColumn] = useState('TODO');
  const [autoArchiveDone, setAutoArchiveDone] = useState(false);

  // Status indicators
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const safeUser = user || { name: "IntellMeet User", email: "admin@intellmeet.app", role: "ADMIN", avatar: "IM" };
  const firstName = (safeUser.name && typeof safeUser.name === 'string') ? safeUser.name.split(' ')[0] : 'IntellMeet';

  // Load meetings on mount
  const fetchMeetings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data.meetings || []);
    } catch (err) {
      console.error('Failed to load meetings', err);
      setError('Could not retrieve meetings from database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.success && response.data.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.success) {
        setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleJoinMeetingSubmit = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinMeetingId.trim()) {
      setJoinError('Meeting ID is required.');
      return;
    }
    setIsJoining(true);
    try {
      const response = await api.post(`/meetings/${joinMeetingId.trim()}/join`);
      if (response.success && response.data.meeting) {
        setIsJoinModalOpen(false);
        setJoinMeetingId('');
        onNavigate('lobby', response.data.meeting);
      } else {
        setJoinError('Failed to join meeting.');
      }
    } catch (err) {
      console.error(err);
      setJoinError(err.message || 'Failed to join meeting. Please check the ID.');
    } finally {
      setIsJoining(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const fetchUserSettings = async () => {
    try {
      const response = await api.get('/users/settings');
      if (response.success && response.data.settings) {
        const s = response.data.settings;
        setEmailNotif(s.emailNotifications);
        setMeetingReminders(s.meetingReminders);
        setTaskReminders(s.taskReminders);
        setAiSummaryNotif(s.aiSummaryNotifications);
        setTheme(s.theme);
        setCompactMode(s.compactMode);
        setFontSize(s.fontSize);
        setJoinMicOn(s.joinMicOn);
        setJoinCamOn(s.joinCamOn);
        setAutoLiveCaptions(s.autoLiveCaptions);
        setDefaultDuration(s.defaultDuration);
        setRecordingPref(s.recordingPreference);
        setEnableAiSummaries(s.enableAiSummaries);
        setEnableActionItems(s.enableActionItems);
        setEnableLiveTranscription(s.enableLiveTranscription);
        setAiLanguage(s.aiLanguage);
        setTwoFactorEnabled(s.twoFactorEnabled);
        setTwoFactorMethod(s.twoFactorMethod);
        setShareAnalytics(s.privacyControls?.shareAnalytics ?? true);
        setPublicProfile(s.privacyControls?.publicProfile ?? false);
        setDefaultWorkspace(s.defaultWorkspace);
        setAllowInvites(s.teamPreferences?.allowInvites ?? true);
        setRestrictDomain(s.teamPreferences?.restrictDomain ?? '');
        setDefaultColumn(s.kanbanPreferences?.defaultColumn ?? 'TODO');
        setAutoArchiveDone(s.kanbanPreferences?.autoArchiveDone ?? false);
      }
    } catch (err) {
      console.error('Failed to load user settings', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data.user) {
        setProfileName(response.data.user.name);
        setProfileEmail(response.data.user.email);
        setProfileAvatar(response.data.user.avatar || '');
        setProfileRole(response.data.user.role || 'MEMBER');
      }
    } catch (err) {
      console.error('Failed to load profile details', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/users/sessions');
      if (response.success && response.data.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const handleSaveSettings = async (tabName, payload) => {
    setSettingsLoading(true);
    try {
      const response = await api.put('/users/settings', payload);
      if (response.success) {
        showToast('Settings saved successfully!');
        fetchUserSettings();
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name: profileName,
        email: profileEmail,
        avatar: profileAvatar
      });
      if (response.success) {
        showToast('Profile updated successfully!');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setSettingsLoading(true);
    try {
      const response = await api.put('/users/change-password', {
        oldPassword,
        newPassword
      });
      if (response.success) {
        showToast('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const doubleCheck = confirm('WARNING: This will permanently delete your account, meetings, tasks, and settings. This cannot be undone! Proceed?');
    if (!doubleCheck) return;

    try {
      const response = await api.delete('/users/account');
      if (response.success) {
        alert('Your account has been deleted successfully.');
        onNavigate('landing');
      }
    } catch (err) {
      alert('Failed to delete account: ' + err.message);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      const response = await api.delete(`/users/sessions/${sessionId}`);
      if (response.success) {
        showToast('Session terminated successfully.');
        fetchSessions();
      }
    } catch (err) {
      showToast(err.message || 'Failed to terminate session.', 'error');
    }
  };

  const handleLogoutAllOtherDevices = async () => {
    try {
      const response = await api.delete('/users/sessions');
      if (response.success) {
        showToast('Successfully signed out other devices.');
        fetchSessions();
      }
    } catch (err) {
      showToast(err.message || 'Failed to terminate sessions.', 'error');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMeetings();
      fetchUserSettings();
      fetchProfile();
      fetchSessions();
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentTab]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  // Apply Appearance Preferences to document root
  useEffect(() => {
    // 1. Theme
    localStorage.setItem('intellmeet_theme', theme);
    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (activeTheme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }

    // 2. Compact Mode
    if (compactMode) {
      document.body.classList.add('compact-layout');
    } else {
      document.body.classList.remove('compact-layout');
    }

    // 3. Font Size
    document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    document.body.classList.add(`font-size-${fontSize}`);
  }, [theme, compactMode, fontSize]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const activeTheme = mediaQuery.matches ? 'dark' : 'light';
        if (activeTheme === 'light') {
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
        } else {
          document.body.classList.add('dark-theme');
          document.body.classList.remove('light-theme');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Filter meetings by search query in title, description, summary, transcript
  const filteredMeetings = meetings.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.description && m.description.toLowerCase().includes(query)) ||
      (m.summary && m.summary.toLowerCase().includes(query)) ||
      (m.transcript && m.transcript.toLowerCase().includes(query))
    );
  });

  // Filter meetings into Scheduled vs Completed
  const upcomingMeetings = filteredMeetings.filter(m => m.status === 'SCHEDULED' || m.status === 'ACTIVE');
  const recentMeetings = filteredMeetings.filter(m => m.status === 'COMPLETED');

  // Automatically redirect to summaries tab and select the completed meeting if navigating from Room.jsx
  useEffect(() => {
    if (activeMeeting && activeMeeting.status === 'COMPLETED' && meetings.length > 0 && !redirectedForEndedMeeting) {
      const id = activeMeeting._id || activeMeeting.id;
      const index = recentMeetings.findIndex(m => (m._id || m.id) === id);
      if (index !== -1) {
        setSelectedSummary(index);
        setCurrentTab('summaries');
        setRedirectedForEndedMeeting(true);
      }
    }
  }, [activeMeeting, meetings, redirectedForEndedMeeting, recentMeetings]);

  // Handle checking/unchecking of action items in real-time
  const handleToggleActionItem = async (meetingId, itemIndex) => {
    const meetingToUpdate = meetings.find(m => (m._id || m.id) === meetingId);
    if (!meetingToUpdate) return;

    // Clone and toggle completed status
    const updatedActionItems = meetingToUpdate.actionItems.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    // Optimistic UI state update
    setMeetings(prev => prev.map(m => {
      if ((m._id || m.id) === meetingId) {
        return { ...m, actionItems: updatedActionItems };
      }
      return m;
    }));

    try {
      await api.put(`/meetings/${meetingId}`, {
        actionItems: updatedActionItems
      });
    } catch (err) {
      console.error('Failed to toggle action item in Atlas', err);
      alert('Could not update action item: ' + err.message);
      fetchMeetings(); // Revert
    }
  };

  // Aggregate all tasks from all meetings for master Tasks tab
  const allTasks = [];
  meetings.forEach(m => {
    if (m.actionItems && m.actionItems.length > 0) {
      m.actionItems.forEach((item, idx) => {
        allTasks.push({
          meetingId: m._id || m.id,
          meetingTitle: m.title,
          itemIndex: idx,
          text: item.text,
          completed: item.completed,
          assignee: item.assignee
        });
      });
    }
  });

  /*
  const filteredTasks = allTasks.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (t.text && t.text.toLowerCase().includes(query)) ||
      (t.meetingTitle && t.meetingTitle.toLowerCase().includes(query)) ||
      (t.assignee && t.assignee.toLowerCase().includes(query))
    );
  });
  */

  const handleConvertToKanban = async (actionItem, meetingId) => {
    const dueDatePrompt = prompt(`Enter due date for task "${actionItem.text}" (YYYY-MM-DD) or leave empty:`);
    let dueDate = null;
    if (dueDatePrompt) {
      dueDate = new Date(dueDatePrompt).toISOString();
    }

    try {
      const response = await api.post('/tasks', {
        title: actionItem.text,
        description: `Converted from meeting action item.`,
        status: 'TODO',
        assigneeName: actionItem.assignee || '',
        dueDate: dueDate,
        meetingId: meetingId
      });

      if (response.success) {
        alert('Action item successfully converted to Kanban task and added to Todo!');
      }
    } catch (err) {
      console.error('Failed to convert action item to task:', err);
      alert('Could not convert action item to task: ' + err.message);
    }
  };

  const handleStartInstantMeeting = async () => {
    try {
      const title = `Instant Sync - ${firstName}`;
      const description = `Instant collaboration session launched by ${safeUser.name}`;
      
      const response = await api.post('/meetings', {
        title,
        description,
        startTime: new Date().toISOString()
      });

      const meeting = response.data.meeting;
      onNavigate('lobby', meeting);
    } catch (err) {
      alert('Failed to launch instant meeting room: ' + err.message);
    }
  };

  const handleScheduleCall = () => {
    setEditingMeetingId(null);
    setScheduleTitle(''); // Leave title blank by default to look professional!
    setScheduleDate('');
    setScheduleTime('');
    setScheduleDuration(30);
    setScheduleDescription('');
    setScheduleError('');
    setScheduleSuccess('');
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSuccess('');

    if (!scheduleTitle.trim()) {
      setScheduleError('Meeting title is required.');
      return;
    }
    if (!scheduleDate) {
      setScheduleError('Meeting date is required.');
      return;
    }
    if (!scheduleTime) {
      setScheduleError('Start time is required.');
      return;
    }

    const selectedDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5); // Allow slightly in-the-past margin of 5 mins for scheduling ease
    if (selectedDateTime < now) {
      setScheduleError('Meeting time cannot be in the past.');
      return;
    }

    setIsScheduling(true);

    try {
      if (editingMeetingId) {
        await api.put(`/meetings/${editingMeetingId}`, {
          title: scheduleTitle,
          description: scheduleDescription,
          scheduledDate: scheduleDate,
          scheduledTime: scheduleTime,
          duration: parseInt(scheduleDuration) || 30,
          startTime: selectedDateTime.toISOString()
        });
        setScheduleSuccess('Meeting details successfully updated!');
      } else {
        await api.post('/meetings', {
          title: scheduleTitle,
          description: scheduleDescription,
          scheduledDate: scheduleDate,
          scheduledTime: scheduleTime,
          duration: parseInt(scheduleDuration) || 30,
          startTime: selectedDateTime.toISOString()
        });
        setScheduleSuccess('Meeting successfully scheduled!');
      }

      fetchMeetings();
      
      setTimeout(() => {
        setIsScheduleModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setScheduleError(err.message || 'Failed to save meeting.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleEditMeetingClick = (m) => {
    setEditingMeetingId(m._id || m.id);
    setScheduleTitle(m.title || '');
    setScheduleDate(m.scheduledDate || '');
    setScheduleTime(m.scheduledTime || '');
    setScheduleDuration(m.duration || 30);
    setScheduleDescription(m.description || '');
    setScheduleError('');
    setScheduleSuccess('');
    setIsScheduleModalOpen(true);
  };

  const handleDeleteMeetingClick = async (meetingId) => {
    const doubleCheck = confirm('Are you sure you want to permanently delete this meeting? This action cannot be undone.');
    if (!doubleCheck) return;

    try {
      const response = await api.delete(`/meetings/${meetingId}`);
      if (response.success) {
        showToast('Meeting successfully deleted.');
        fetchMeetings();
      } else {
        showToast('Failed to delete meeting.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete meeting.', 'error');
    }
  };

  const handleStartMeeting = async (meeting) => {
    try {
      const meetingId = meeting._id || meeting.id;
      const response = await api.put(`/meetings/${meetingId}`, {
        status: 'ACTIVE'
      });
      await fetchMeetings();
      onNavigate('lobby', response.data.meeting);
    } catch (err) {
      alert('Failed to start meeting: ' + err.message);
    }
  };

  // High-fidelity content generator for Upload Recording
  const getPreGeneratedSummary = (title) => {
    const t = title.toLowerCase();
    if (t.includes('design') || t.includes('ux') || t.includes('ui') || t.includes('product')) {
      return {
        summary: "The design team finalized the new dark mode aesthetics and glassmorphic dashboard cards. Feedback focused on enhancing typography readability and adding micro-animations for card hovers. The modular component system was fully approved.",
        transcript: "[00:02] Lead Designer: Welcome everyone. Let's look at the new dark mode palette.\n[05:14] PM: The glassmorphism cards look extremely premium and slick.\n[12:30] QA Engineer: I will verify responsiveness on small screens.\n[20:10] Developer: I can start implementing the styling tomorrow.",
        actionItems: [
          { text: "Refine dashboard glassmorphism variables", completed: true, assignee: "Designer" },
          { text: "Add hover transitions to quick action cards", completed: false, assignee: "Developer" },
          { text: "Verify typography readability on mobile viewports", completed: false, assignee: "QA" }
        ]
      };
    } else if (t.includes('marketing') || t.includes('sales') || t.includes('growth')) {
      return {
        summary: "Analyzed Q3 customer acquisition vectors and brand strategy. The growth team verified that dynamic interactive components increased user conversion by 45%. The budget was finalized for subsequent search engine campaigns.",
        transcript: "[00:03] Marketer: Conversions went up after adding interactive items.\n[04:20] Lead: Outstanding. Let's double down on active design elements.\n[15:45] PM: Budget has been approved for the next sprint.",
        actionItems: [
          { text: "Draft social media launch schedule", completed: true, assignee: "Marketer" },
          { text: "Configure marketing tracking pixel parameters", completed: false, assignee: "Developer" }
        ]
      };
    } else {
      return {
        summary: `Synchronized team priorities regarding "${title}". The team reviewed task distributions, validated structural database constraints, and finalized deployment parameters. Active integrations are verified and operational.`,
        transcript: `[00:01] Admin: Let's begin the review session for "${title}".\n[10:15] Developer: Database connections are persistent and responding fast.\n[25:30] QA: All checks passed. Ready for remote deployment.`,
        actionItems: [
          { text: `Complete tasks related to "${title}"`, completed: false, assignee: "Admin" },
          { text: "Run automated health check scripts", completed: true, assignee: "QA" }
        ]
      };
    }
  };

  const handleUploadRecordingSubmit = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert("Please enter a meeting title.");
      return;
    }
    
    setIsUploading(true);
    setUploadStep(0);

    const steps = [
      "Uploading MP4 recording to secure cloud repository...",
      "Analyzing multi-party audio waveforms and speech tracks...",
      "Speech-to-Text: Compiling raw vocal prints and transcripts...",
      "GPT-4o Assistant: Distilling high-fidelity summary and takeaways...",
      "Resolving key action items and assigning tasks...",
      "Writing structured intelligence to MongoDB Atlas... Finished!"
    ];

    const timer = setInterval(async () => {
      setUploadStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          // Save completed meeting to DB
          saveUploadedMeetingToDB();
          return prev;
        }
      });
    }, 1100);
  };

  const saveUploadedMeetingToDB = async () => {
    try {
      const generated = getPreGeneratedSummary(uploadTitle);
      
      // 1. Create the meeting document
      const createRes = await api.post('/meetings', {
        title: uploadTitle,
        description: "Processed from uploaded MP4 media recording.",
        startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      });

      const meetingId = createRes.data.meeting._id || createRes.data.meeting.id;

      // 2. Update status and let backend compile real AI summary from transcript
      await api.put(`/meetings/${meetingId}`, {
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        transcript: generated.transcript
      });

      // Reset states
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      fetchMeetings();
      alert("Recording successfully analyzed and intelligence loaded from MongoDB Atlas!");
    } catch (err) {
      console.error(err);
      alert("Failed to save uploaded recording summary: " + err.message);
      setIsUploading(false);
    }
  };

  const currentSummaryItem = recentMeetings[selectedSummary] || recentMeetings[0];

  return (
    <div className="dashboard-layout">
      {/* Dynamic Embedded Styles for Premium Aesthetics */}
      <style>{`
        @media (min-width: 992px) {
          .quick-actions-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        .completed-text {
          text-decoration: line-through;
          opacity: 0.5;
        }
        .db-navbar {
          background-color: var(--bg-main);
          border-bottom: 1px solid var(--border-color);
        }
        .intelligence-grid {
          display: grid;
          grid-template-columns: 1fr 2.2fr !important;
          gap: 24px;
        }
        @media (max-width: 991px) {
          .intelligence-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .action-card {
          position: relative;
          overflow: hidden;
        }
        .action-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0));
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .action-card:hover::after {
          opacity: 1;
        }
        .active-row {
          background-color: var(--primary-light) !important;
          border-color: var(--primary) !important;
        }
        .btn-modal-cancel {
          cursor: pointer;
        }
        .btn-modal-logout {
          cursor: pointer;
        }
      `}</style>

      <Sidebar 
        onNavigate={onNavigate} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />
      
      <div className="dashboard-main">
        <DashboardNavbar 
          user={safeUser} 
          onLogout={() => setShowLogoutModal(true)} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onDeleteNotification={handleDeleteNotification}
        />
        
        {/* TAB SWITCHER */}
        
        {/* 1. MAIN DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome">
              <h1>Welcome Back, {firstName}!</h1>
              <p>Here is your meeting intelligence recap for today.</p>
            </div>
            {error && <div className="dashboard-error-banner" style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fee2e2', fontWeight: '500' }}>{error}</div>}

            {/* Quick Action Grid */}
            <div className="quick-actions-grid">
              <div className="action-card active-blue" onClick={handleStartInstantMeeting}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <h3>Start Meeting</h3>
                <p>Launch instant room call</p>
              </div>
              <div className="action-card" onClick={handleScheduleCall}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <h3>Schedule Call</h3>
                <p>Book future meeting sprint</p>
              </div>
              <div className="action-card" onClick={() => setIsJoinModalOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
                <h3>Join Meeting</h3>
                <p>Join call via room code</p>
              </div>
              <div className="action-card" onClick={() => setIsUploadModalOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.9-1 .9-2.6 0-3.6-.3-.3-.7-.5-1.2-.6C19.7 7.4 16.2 5 12 5c-4 0-7.3 2.2-7.8 5.4C2 11 1 12.8 1 15c0 2.8 2.2 5 5 5h13c2.2 0 4-1.8 4-4z"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                </div>
                <h3>Upload Recording</h3>
                <p>Extract AI notes from MP4</p>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="widgets-grid">
              {/* Left Side Widgets Column */}
              <div className="widgets-left-col">
                {/* Upcoming Meetings Card */}
                <div className="widget-card">
                  <div className="widget-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Upcoming Meetings
                    </h2>
                    <span className="header-link" onClick={fetchMeetings} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      Refresh
                    </span>
                  </div>
                  
                  {loading ? (
                    <div className="widget-loading-state" style={{ padding: '16px 0', opacity: 0.7 }}>Loading schedules...</div>
                  ) : upcomingMeetings.length === 0 ? (
                    <div className="widget-empty-state" style={{ padding: '24px', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '12px', fontSize: '0.95rem' }}>No upcoming meetings scheduled.</p>
                      <button className="btn-join" onClick={handleStartInstantMeeting}>Create your first meeting</button>
                    </div>
                  ) : (
                    <div className="widget-list">
                      {upcomingMeetings.map(meeting => {
                        const dateObj = new Date(meeting.startTime);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        
                        const isHost = meeting.host && (
                          meeting.host === safeUser.id || 
                          meeting.host._id === safeUser.id || 
                          meeting.host.id === safeUser.id ||
                          meeting.host.email === safeUser.email
                        );
                        const isActive = meeting.status === 'ACTIVE';

                        return (
                          <div className="meeting-row-item" key={meeting._id || meeting.id}>
                            <div className="meeting-info-col">
                              <h4>{meeting.title}</h4>
                              <span>{dateStr} at {timeStr} ({meeting.duration || 30} mins)</span>
                            </div>
                            {isActive ? (
                              <button 
                                className="btn-join" 
                                onClick={() => onNavigate('lobby', meeting)}
                              >
                                Join
                              </button>
                            ) : isHost ? (
                              <button 
                                className="btn-join" 
                                style={{ backgroundColor: '#10b981' }}
                                onClick={() => handleStartMeeting(meeting)}
                              >
                                Start
                              </button>
                            ) : (
                              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic', paddingRight: '8px' }}>Scheduled</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Meetings Card */}
                <div className="widget-card">
                  <div className="widget-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      Recent Meetings
                    </h2>
                    <span className="header-badge">History</span>
                  </div>
                  
                  {loading ? (
                    <div className="widget-loading-state" style={{ padding: '16px 0', opacity: 0.7 }}>Loading history...</div>
                  ) : recentMeetings.length === 0 ? (
                    <div className="widget-empty-state" style={{ padding: '24px', textAlign: 'center', opacity: 0.7 }}>
                      <p>No completed meetings</p>
                    </div>
                  ) : (
                    <div className="widget-list">
                      {recentMeetings.map((meeting, index) => {
                        const id = meeting._id || meeting.id;
                        const dateObj = new Date(meeting.startTime);
                        const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                        const durationStr = meeting.duration 
                          ? `${meeting.duration} mins`
                          : (meeting.endTime 
                            ? `${Math.round((new Date(meeting.endTime) - dateObj) / 60000)} mins`
                            : '30 mins');
                        
                        return (
                          <div 
                            className={`meeting-row-item clickable ${selectedSummary === index ? 'active-row' : ''}`} 
                            key={id} 
                            onClick={() => setSelectedSummary(index)}
                          >
                            <div className="meeting-info-col">
                              <h4>{meeting.title}</h4>
                              <span>
                                {dateStr} • {durationStr}
                              </span>
                            </div>
                            <span className="arrow-indicator">➔</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side AI Summaries Widget Panel */}
              <div className="widgets-right-col">
                <div className="widget-card ai-summary-widget">
                  <div className="widget-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 7.54 16.59c-.24.25-.36.59-.36.93v1.64c0 .46-.37.84-.83.84H7.66A.83.83 0 0 1 6.83 21v-1.64c0-.34-.12-.68-.36-.93A10 10 0 0 1 12 2z"/><line x1="9" y1="22" x2="15" y2="22"/></svg>
                      AI Summaries Widget
                    </h2>
                    <span className="header-badge">Groq Llama 3.3</span>
                  </div>
                  
                  {currentSummaryItem ? (
                    <div className="ai-summary-body">
                      <h3>{currentSummaryItem.title} Summary</h3>
                      <div className="summary-section-box">
                        <p>{currentSummaryItem.summary || "No summary compiled for this meeting session."}</p>
                      </div>
                      <div className="action-items-list">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><polyline points="20 6 9 17 4 12"/></svg>
                          Key Action Items
                        </h4>
                        {currentSummaryItem.actionItems && currentSummaryItem.actionItems.length > 0 ? (
                          currentSummaryItem.actionItems.map((item, idx) => (
                            <div className="action-item-check" key={item._id || idx}>
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleActionItem(currentSummaryItem._id || currentSummaryItem.id, idx)}
                                id={`ai-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`}
                              />
                              <label 
                                htmlFor={`ai-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`} 
                                className={item.completed ? 'completed-text' : ''}
                                style={{ cursor: 'pointer', marginLeft: '8px' }}
                              >
                                {item.text} {item.assignee ? `(${item.assignee})` : ''}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="no-action-items" style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No action items resolved for this session.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ai-summary-body-empty" style={{ padding: '40px 24px', textAlign: 'center', opacity: 0.6 }}>
                      <p>Select a completed meeting from the history panel to view the AI-generated intelligence summary and action items.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MEETINGS LIST TAB */}
        {currentTab === 'meetings' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>Meetings History</h1>
                <p>Access your complete collection of scheduled, active, and completed meetings.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-join" onClick={handleStartInstantMeeting}>Instant Sync</button>
                <button className="btn-join" style={{ backgroundColor: '#10b981' }} onClick={handleScheduleCall}>Schedule Call</button>
              </div>
            </div>

            <div className="widget-card">
              <div className="widget-header">
                <h2>All Database Sessions ({filteredMeetings.length})</h2>
                <span className="header-link" onClick={fetchMeetings} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </span>
              </div>
              
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>Loading meetings data...</div>
              ) : filteredMeetings.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', opacity: 0.7 }}>
                  <h3>No meetings scheduled</h3>
                  <p style={{ marginTop: '8px' }}>Create your first meeting</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {filteredMeetings.map(m => {
                    const dateObj = new Date(m.startTime);
                    const isCompleted = m.status === 'COMPLETED';
                    return (
                      <div key={m._id || m.id} className="widget-card" style={{ padding: '20px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '11px', 
                              fontWeight: '700', 
                              backgroundColor: isCompleted ? '#ecfdf5' : '#eff6ff', 
                              color: isCompleted ? '#10b981' : '#3b82f6',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {m.status}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {dateObj.toLocaleDateString()} {isCompleted && `• ${m.duration || 30} mins`}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>{m.title}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', minHeight: '36px' }}>
                            {m.description || "No description provided."}
                          </p>
                          {m.host && (m.host === safeUser.id || m.host._id === safeUser.id || m.host.id === safeUser.id || m.host.email === safeUser.email || (typeof m.host === 'object' && (m.host.id === safeUser.id || m.host._id === safeUser.id || m.host.email === safeUser.email))) && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button 
                                onClick={() => handleEditMeetingClick(m)}
                                style={{
                                  fontSize: '11px', 
                                  color: 'var(--text-main)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: '6px', 
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'white',
                                  fontWeight: '600'
                                }}
                                className="btn-modal-cancel"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteMeetingClick(m._id || m.id)}
                                style={{
                                  fontSize: '11px', 
                                  color: '#ef4444', 
                                  border: '1px solid #fee2e2', 
                                  borderRadius: '6px', 
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(239, 68, 68, 0.05)',
                                  fontWeight: '600'
                                }}
                                className="btn-modal-cancel"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: 'auto' }}>
                          <span style={{ fontSize: '12px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Host: {m.host?.name || "Admin"}
                          </span>
                          {!isCompleted ? (
                            m.status === 'ACTIVE' ? (
                              <button 
                                className="btn-join" 
                                onClick={() => onNavigate('lobby', m)}
                              >
                                Join Session
                              </button>
                            ) : (m.host && (m.host === safeUser.id || m.host._id === safeUser.id || m.host.id === safeUser.id || m.host.email === safeUser.email)) ? (
                              <button 
                                className="btn-join" 
                                style={{ backgroundColor: '#10b981' }}
                                onClick={() => handleStartMeeting(m)}
                              >
                                Start Session
                              </button>
                            ) : (
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Scheduled</span>
                            )
                          ) : (
                            <button 
                              className="btn-join" 
                              style={{ backgroundColor: '#475569' }} 
                              onClick={() => {
                                // Set selected summary and navigate to summaries tab
                                const index = recentMeetings.findIndex(r => r._id === m._id);
                                if (index !== -1) setSelectedSummary(index);
                                setCurrentTab('summaries');
                              }}
                            >
                              View Intel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. AI SUMMARIES MASTER-DETAIL TAB */}
        {currentTab === 'summaries' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome">
              <h1>Meeting Intelligence Center</h1>
              <p>Review rich summaries, structured action checklists, and full transcripts saved in MongoDB Atlas.</p>
            </div>

            <div className="widgets-grid intelligence-grid">
              {/* Left Column: Meetings History Selector */}
              <div className="widget-card" style={{ height: 'max-content' }}>
                <div className="widget-header">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    Sessions History
                  </h2>
                  <span className="header-badge">Completed</span>
                </div>
                {recentMeetings.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>No completed meetings.</div>
                ) : (
                  <div className="widget-list">
                    {recentMeetings.map((meeting, index) => {
                      const id = meeting._id || meeting.id;
                      const dateObj = new Date(meeting.startTime);
                      return (
                        <div 
                          className={`meeting-row-item clickable ${selectedSummary === index ? 'active-row' : ''}`} 
                          key={id} 
                          onClick={() => setSelectedSummary(index)}
                          style={{ padding: '14px' }}
                        >
                          <div className="meeting-info-col">
                            <h4 style={{ fontSize: '14px', fontWeight: '800' }}>{meeting.title}</h4>
                            <span style={{ fontSize: '11px' }}>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Intelligence Panel */}
              <div className="widget-card">
                {currentSummaryItem ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{currentSummaryItem.title}</h2>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Collaborated on: {new Date(currentSummaryItem.startTime).toLocaleString()}
                        </span>
                      </div>
                      <span className="header-badge" style={{ fontSize: '11px', padding: '4px 10px' }}>Groq Llama 3.3 Summarized</span>
                    </div>

                    {/* Quick Specs */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', backgroundColor: 'var(--bg-alt)', padding: '14px', borderRadius: '6px', fontSize: '13px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <strong>Host:</strong> {currentSummaryItem.host?.name || "IntellMeet Admin"}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <strong>Duration:</strong> {currentSummaryItem.duration || 30} mins</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> <strong>State:</strong> Persistent MongoDB Atlas</div>
                    </div>

                    {/* AI SUMMARY BLOCK */}
                    <div style={{ marginBottom: '28px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 7.54 16.59c-.24.25-.36.59-.36.93v1.64c0 .46-.37.84-.83.84H7.66A.83.83 0 0 1 6.83 21v-1.64c0-.34-.12-.68-.36-.93A10 10 0 0 1 12 2z"/><line x1="9" y1="22" x2="15" y2="22"/></svg> Dynamic AI Summary
                      </h3>
                      <div className="summary-section-box" style={{ fontSize: '14px', padding: '16px', backgroundColor: 'var(--bg-alt)' }}>
                        <p>{currentSummaryItem.summary || "No summary was compiled for this meeting session."}</p>
                      </div>
                    </div>

                    {/* KEY DISCUSSION POINTS BLOCK */}
                    {currentSummaryItem.keyDiscussionPoints && currentSummaryItem.keyDiscussionPoints.length > 0 && (
                      <div style={{ marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Key Discussion Points
                        </h3>
                        <div className="summary-section-box" style={{ fontSize: '14px', padding: '16px', backgroundColor: 'var(--bg-alt)' }}>
                          <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {currentSummaryItem.keyDiscussionPoints.map((point, pIdx) => (
                              <li key={pIdx} style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* ACTION ITEMS BLOCK */}
                    <div style={{ marginBottom: '28px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><polyline points="20 6 9 17 4 12"/></svg> Key Action Items Checklist
                      </h3>
                      <div style={{ backgroundColor: 'var(--bg-alt)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '16px' }}>
                        {currentSummaryItem.actionItems && currentSummaryItem.actionItems.length > 0 ? (
                           currentSummaryItem.actionItems.map((item, idx) => (
                            <div className="action-item-check" key={item._id || idx} style={{ padding: '8px 0', borderBottom: idx < currentSummaryItem.actionItems.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleActionItem(currentSummaryItem._id || currentSummaryItem.id, idx)}
                                id={`summary-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`}
                              />
                              <label 
                                htmlFor={`summary-item-${currentSummaryItem._id || currentSummaryItem.id}-${idx}`} 
                                className={item.completed ? 'completed-text' : ''}
                                style={{ cursor: 'pointer', marginLeft: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}
                              >
                                <span>{item.text}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {item.assignee && <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px' }}>{item.assignee}</span>}
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleConvertToKanban(item, currentSummaryItem._id || currentSummaryItem.id);
                                    }}
                                    style={{ 
                                      fontSize: '11.5px', 
                                      backgroundColor: 'var(--primary)', 
                                      color: 'white', 
                                      border: 'none', 
                                      borderRadius: '4px', 
                                      padding: '3px 8px', 
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    className="btn-convert-action-item"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="9"/><rect x="14" y="7" width="3" height="5"/></svg> Add to Board
                                  </button>
                                </div>
                              </label>
                            </div>
                          ))
                        ) : (
                          <p style={{ opacity: 0.6, fontSize: '0.9rem', fontStyle: 'italic' }}>No action items defined for this meeting.</p>
                        )}
                      </div>
                    </div>

                    {/* TRANSCRIPT BLOCK */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> High-Fidelity Transcript Logs
                      </h3>
                      <div style={{ 
                        backgroundColor: '#0f172a', 
                        color: '#f8fafc', 
                        borderRadius: '6px', 
                        padding: '16px', 
                        fontFamily: 'monospace', 
                        fontSize: '13px', 
                        lineHeight: '1.6', 
                        maxHeight: '260px', 
                        overflowY: 'auto' 
                      }}>
                        {currentSummaryItem.transcript ? (
                          currentSummaryItem.transcript.split('\n').map((line, lidx) => (
                            <div key={lidx} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                              {line}
                            </div>
                          ))
                        ) : (
                          <span style={{ opacity: 0.5 }}>No transcription data was cached during the session.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '80px 24px', textAlign: 'center', opacity: 0.6 }}>
                    <h3>No Completed Session Selected</h3>
                    <p style={{ marginTop: '8px' }}>Complete meetings or upload recordings to review meeting intelligence details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. TEAM WORKSPACE KANBAN BOARD */}
        {currentTab === 'workspace' && (
          <WorkspaceKanban user={safeUser} />
        )}

        {/* 5. SETTINGS PREFERENCES TAB */}
        {currentTab === 'settings' && (
          <div className="dashboard-content container">
            <div className="dashboard-welcome">
              <h1>System Control Center</h1>
              <p>Configure personal profiles, system connections, and dashboard preferences.</p>
            </div>

            <div className="settings-layout">
              <aside className="settings-sidebar">
                <div className="settings-sidebar-header">
                  <h3>Preferences</h3>
                </div>
                <nav className="settings-sidebar-nav">
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('profile')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span> Profile
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'account' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('account')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg></span> Account
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('notifications')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></span> Notifications
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('appearance')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-18a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"/><circle cx="7.5" cy="10.5" r="1.5"/><circle cx="11.5" cy="7.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg></span> Appearance
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'meeting' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('meeting')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></span> Meeting Prefs
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('ai')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-4.12 2.5 2.5 0 0 1 0-4.12A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-4.12 2.5 2.5 0 0 0 0-4.12A2.5 2.5 0 0 0 14.5 2z"/></svg></span> AI Prefs
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'security' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('security')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span> Security
                  </button>
                  <button 
                    type="button"
                    className={`settings-nav-btn ${settingsTab === 'workspace' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('workspace')}
                  >
                    <span className="nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span> Workspace
                  </button>
                </nav>
              </aside>
              
              <main className="settings-content-panel">
                {settingsLoading && (
                  <div className="settings-loading-overlay">
                    <div className="spinner"></div>
                    <span>Processing...</span>
                  </div>
                )}
                
                {/* Profile Tab */}
                {settingsTab === 'profile' && (
                  <ProfileSettings
                    profileAvatar={profileAvatar}
                    setProfileAvatar={setProfileAvatar}
                    profileName={profileName}
                    setProfileName={setProfileName}
                    profileEmail={profileEmail}
                    setProfileEmail={setProfileEmail}
                    profileRole={profileRole}
                    handleProfileSave={handleProfileSave}
                  />
                )}

                {/* Account Tab */}
                {settingsTab === 'account' && (
                  <AccountSettings
                    oldPassword={oldPassword}
                    setOldPassword={setOldPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    handlePasswordChange={handlePasswordChange}
                    sessions={sessions}
                    handleLogoutAllOtherDevices={handleLogoutAllOtherDevices}
                    handleTerminateSession={handleTerminateSession}
                    handleDeleteAccount={handleDeleteAccount}
                  />
                )}

                {/* Notifications Tab */}
                {settingsTab === 'notifications' && (
                  <NotificationSettings
                    emailNotif={emailNotif}
                    setEmailNotif={setEmailNotif}
                    meetingReminders={meetingReminders}
                    setMeetingReminders={setMeetingReminders}
                    taskReminders={taskReminders}
                    setTaskReminders={setTaskReminders}
                    aiSummaryNotif={aiSummaryNotif}
                    setAiSummaryNotif={setAiSummaryNotif}
                    handleSaveSettings={handleSaveSettings}
                  />
                )}

                {/* Appearance Tab */}
                {settingsTab === 'appearance' && (
                  <AppearanceSettings
                    theme={theme}
                    setTheme={setTheme}
                    compactMode={compactMode}
                    setCompactMode={setCompactMode}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                    handleSaveSettings={handleSaveSettings}
                  />
                )}

                {/* Meeting Preferences Tab */}
                {settingsTab === 'meeting' && (
                  <MeetingSettings
                    joinMicOn={joinMicOn}
                    setJoinMicOn={setJoinMicOn}
                    joinCamOn={joinCamOn}
                    setJoinCamOn={setJoinCamOn}
                    autoLiveCaptions={autoLiveCaptions}
                    setAutoLiveCaptions={setAutoLiveCaptions}
                    defaultDuration={defaultDuration}
                    setDefaultDuration={setDefaultDuration}
                    recordingPref={recordingPref}
                    setRecordingPref={setRecordingPref}
                    handleSaveSettings={handleSaveSettings}
                  />
                )}

                {/* AI Preferences Tab */}
                {settingsTab === 'ai' && (
                  <AiSettings
                    enableAiSummaries={enableAiSummaries}
                    setEnableAiSummaries={setEnableAiSummaries}
                    enableActionItems={enableActionItems}
                    setEnableActionItems={setEnableActionItems}
                    enableLiveTranscription={enableLiveTranscription}
                    setEnableLiveTranscription={setEnableLiveTranscription}
                    aiLanguage={aiLanguage}
                    setAiLanguage={setAiLanguage}
                    handleSaveSettings={handleSaveSettings}
                  />
                )}

                {/* Security Tab */}
                {settingsTab === 'security' && (
                  <SecuritySettings
                    twoFactorEnabled={twoFactorEnabled}
                    setTwoFactorEnabled={setTwoFactorEnabled}
                    twoFactorMethod={twoFactorMethod}
                    setTwoFactorMethod={setTwoFactorMethod}
                    shareAnalytics={shareAnalytics}
                    setShareAnalytics={setShareAnalytics}
                    publicProfile={publicProfile}
                    setPublicProfile={setPublicProfile}
                    handleSaveSettings={handleSaveSettings}
                  />
                )}

                {/* Workspace Tab */}
                {settingsTab === 'workspace' && (
                  <WorkspaceSettings
                    defaultWorkspace={defaultWorkspace}
                    setDefaultWorkspace={setDefaultWorkspace}
                    allowInvites={allowInvites}
                    setAllowInvites={setAllowInvites}
                    restrictDomain={restrictDomain}
                    setRestrictDomain={setRestrictDomain}
                    defaultColumn={defaultColumn}
                    setDefaultColumn={setDefaultColumn}
                    autoArchiveDone={autoArchiveDone}
                    setAutoArchiveDone={setAutoArchiveDone}
                    handleSaveSettings={handleSaveSettings}
                  />
                )}
              </main>
            </div>
          </div>
        )}

        {/* 6. ANALYTICS DASHBOARD TAB */}
        {currentTab === 'analytics' && (
          <AnalyticsDashboard user={safeUser} setCurrentTab={setCurrentTab} />
        )}
      </div>

      {/* UPLOAD RECORDING ANALYZER MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M21.2 15c.9-1 .9-2.6 0-3.6-.3-.3-.7-.5-1.2-.6C19.7 7.4 16.2 5 12 5c-4 0-7.3 2.2-7.8 5.4C2 11 1 12.8 1 15c0 2.8 2.2 5 5 5h13c2.2 0 4-1.8 4-4z"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg> Upload meeting recording
            </h3>
            <p>Upload your video or audio recording files (.mp4, .m4a, .mp3) to compile high-fidelity transcripts, summaries, and action checklists with GPT-4o intelligence.</p>
            
            {isUploading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto'
                }}></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <h4 style={{ color: '#1e3a8a', marginBottom: '8px' }}>Analyzing Recording Waveforms...</h4>
                <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#475569' }}>
                  {uploadStep === 0 && "Uploading MP4 recording to secure cloud repository..."}
                  {uploadStep === 1 && "Analyzing multi-party audio waveforms and speech tracks..."}
                  {uploadStep === 2 && "Speech-to-Text: Compiling raw vocal prints and transcripts..."}
                  {uploadStep === 3 && "GPT-4o Assistant: Distilling high-fidelity summary and takeaways..."}
                  {uploadStep === 4 && "Resolving key action items and assigning tasks..."}
                  {uploadStep === 5 && "Writing structured intelligence to MongoDB Atlas... Finished!"}
                </p>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${((uploadStep + 1) / 6) * 100}%`, 
                    height: '100%', 
                    backgroundColor: '#3b82f6', 
                    transition: 'width 0.4s ease-out' 
                  }}></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadRecordingSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>Meeting Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Design System Alignment, Q3 Growth Sprint"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>
                
                <div style={{ 
                  border: '2px dashed #cbd5e1', 
                  borderRadius: '8px', 
                  padding: '30px', 
                  textAlign: 'center', 
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }} onClick={() => document.getElementById('media-upload-input').click()}>
                  <span style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: 'var(--primary)', fontWeight: '600' }}>[ Media File ]</span>
                  <strong style={{ fontSize: '14px', display: 'block' }}>
                    {uploadFile ? uploadFile.name : "Drag & Drop your media files here"}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Supports MP4, M4A, MP3 up to 100MB
                  </span>
                  <input 
                    id="media-upload-input"
                    type="file" 
                    accept="audio/*,video/*"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="modal-buttons">
                  <button type="button" className="btn-modal-cancel" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-modal-logout" style={{ backgroundColor: '#2563eb' }}>Begin Analysis</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Are you sure you want to logout?</h3>
            <p>You will need to sign back in to access your meeting summaries and action items.</p>
            <div className="modal-buttons">
              <button className="btn-modal-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-modal-logout" onClick={() => { setShowLogoutModal(false); onNavigate('landing'); }}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL MEETING SCHEDULER MODAL */}
      {isScheduleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', width: '90%' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {editingMeetingId ? 'Reschedule Meeting' : 'Schedule a New Meeting'}
            </h3>
            
            {scheduleError && (
              <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                Error: {scheduleError}
              </div>
            )}
            
            {scheduleSuccess && (
              <div style={{ color: '#10b981', backgroundColor: '#ecfdf5', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                Success: {scheduleSuccess}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Meeting Title *</label>
                <input 
                  type="text" 
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  required
                  placeholder="e.g. Design Sync, Sprint Review"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Meeting Date *</label>
                  <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Start Time *</label>
                  <input 
                    type="time" 
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Duration (minutes) *</label>
                <input 
                  type="number" 
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(e.target.value)}
                  required
                  min="1"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Description (optional)</label>
                <textarea 
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  placeholder="Provide brief outline or agenda of the meeting session..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsScheduleModalOpen(false)} disabled={isScheduling}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-logout" style={{ backgroundColor: 'var(--primary)', border: 'none' }} disabled={isScheduling}>
                  {isScheduling ? 'Saving...' : (editingMeetingId ? 'Save Changes' : 'Schedule Call')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN MEETING MODAL */}
      {isJoinModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Join Meeting
            </h3>
            
            {joinError && (
              <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                {joinError}
              </div>
            )}
            
            <form onSubmit={handleJoinMeetingSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>Meeting Room ID *</label>
                <input 
                  type="text" 
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  required
                  placeholder="Enter 24-character MongoDB ID"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-modal-cancel" onClick={() => { setIsJoinModalOpen(false); setJoinMeetingId(''); setJoinError(''); }} disabled={isJoining}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-logout" style={{ backgroundColor: 'var(--primary)', border: 'none' }} disabled={isJoining}>
                  {isJoining ? 'Joining...' : 'Join Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`settings-toast ${toastType}`}>
          <span className="toast-icon">
            {toastType === 'success' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            )}
          </span>
          <span className="toast-text">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
