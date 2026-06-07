import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    device: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
      default: 'Unknown IP',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', SessionSchema);
export default Session;
