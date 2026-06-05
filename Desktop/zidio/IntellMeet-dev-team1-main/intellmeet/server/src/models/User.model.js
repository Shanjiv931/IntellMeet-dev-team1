import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Ensures passwords are omitted in user queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MEMBER', 'GUEST'],
        message: '{VALUE} is not a valid role. Allowed roles: ADMIN, MEMBER, GUEST',
      },
      default: 'MEMBER',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Auto-injects createdAt and updatedAt
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash password if it is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12); // Production-grade salt rounds
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare input password with database hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // Since password might be unselected by default, ensure we can compare it
  if (!this.password) {
    throw new Error('Password field not populated in user query context');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;
