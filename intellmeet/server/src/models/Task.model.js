import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
        message: '{VALUE} is not a valid task status. Allowed: TODO, IN_PROGRESS, REVIEW, DONE',
      },
      default: 'TODO',
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assigneeName: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      index: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task creator is required'],
      index: true,
    }
  },
  {
    timestamps: true,
  }
);

// Populate assignee info automatically
TaskSchema.pre(/^find/, function (next) {
  this.populate('assignee', 'name email role avatar');
  next();
});

const Task = mongoose.model('Task', TaskSchema);
export default Task;
