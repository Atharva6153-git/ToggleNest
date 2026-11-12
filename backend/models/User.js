const mongoose = require('mongoose');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Name cannot be empty'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      match: [EMAIL_PATTERN, 'Email must be a valid email address'],
    },

    password: {
      type: String,
      required: true,
      // Never return the hash from a normal query unless explicitly selected.
      select: false,
    },

    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },

    profilePicture: {
      type: String,
      default: null,
      maxlength: [2048, 'Profile picture URL is too long'],
    },

    profileComplete: {
      type: Boolean,
      default: false,
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
      default: null,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
