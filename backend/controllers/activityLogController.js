const ActivityLog = require('../models/ActivityLog');

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('performedBy', 'name email')
      .sort({ timestamp: -1 });

    return res.json(logs);
  } catch (err) {
    console.error('getActivityLogs error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
