const ActivityLog = require('../models/ActivityLog');

exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('performedBy', 'name email')
      .sort({ timestamp: -1 });

    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('getActivityLogs error', err);
    return next(err);
  }
};
