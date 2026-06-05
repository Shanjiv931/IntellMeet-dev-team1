import mongoose from 'mongoose';

const UserSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Notifications Tab
    emailNotifications: { type: Boolean, default: true },
    meetingReminders: { type: Boolean, default: true },
    taskReminders: { type: Boolean, default: true },
    aiSummaryNotifications: { type: Boolean, default: true },

    // Appearance Tab
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    compactMode: { type: Boolean, default: false },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },

    // Meeting Preferences Tab
    joinMicOn: { type: Boolean, default: false },
    joinCamOn: { type: Boolean, default: false },
    autoLiveCaptions: { type: Boolean, default: true },
    defaultDuration: { type: Number, default: 30 },
    recordingPreference: { type: String, enum: ['cloud', 'local', 'none'], default: 'cloud' },

    // AI Preferences Tab
    enableAiSummaries: { type: Boolean, default: true },
    enableActionItems: { type: Boolean, default: true },
    enableLiveTranscription: { type: Boolean, default: true },
    aiLanguage: { type: String, default: 'en-US' },

    // Security Tab
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['app', 'sms', 'email', 'none'], default: 'none' },
    privacyControls: {
      shareAnalytics: { type: Boolean, default: true },
      publicProfile: { type: Boolean, default: false },
    },

    // Workspace Tab
    defaultWorkspace: { type: String, default: 'My Workspace' },
    teamPreferences: {
      allowInvites: { type: Boolean, default: true },
      restrictDomain: { type: String, default: '' },
    },
    kanbanPreferences: {
      defaultColumn: { type: String, default: 'TODO' },
      autoArchiveDone: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);
export default UserSettings;
