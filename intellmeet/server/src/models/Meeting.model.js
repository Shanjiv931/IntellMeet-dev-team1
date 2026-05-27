import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [100, 'Meeting title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Meeting description cannot exceed 500 characters'],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meeting host reference is required'],
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['SCHEDULED', 'ACTIVE', 'COMPLETED'],
        message: '{VALUE} is not a valid meeting status. Allowed: SCHEDULED, ACTIVE, COMPLETED',
      },
      default: 'SCHEDULED',
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Meeting start time is required'],
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-populate host to save repetitive querying logic in controller
MeetingSchema.pre(/^find/, function (next) {
  this.populate('host', 'name email role');
  next();
});

const Meeting = mongoose.model('Meeting', MeetingSchema);

export default Meeting;
