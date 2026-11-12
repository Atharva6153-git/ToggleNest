const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: [255, 'Activity action cannot exceed 255 characters'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

activityLogSchema.index({ task: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
