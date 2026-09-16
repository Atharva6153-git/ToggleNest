const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const Task = require('../models/Task');

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { project } = req.query;
    const filter = {};

    if (project) {
      if (!mongoose.isValidObjectId(project)) {
        return res.json({ success: true, data: [] });
      }
      const taskIds = await Task.find({ project: { $eq: project } }).select('_id');
      if (!taskIds.length) {
        return res.json({ success: true, data: [] });
      }
      filter.task = { $in: taskIds.map((task) => task._id) };
    }

    const logs = await ActivityLog.find(filter)
      .populate('performedBy', 'name email profilePicture role')
      .populate('task', 'title')
      .sort({ timestamp: -1 });

    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('getActivityLogs error', err);
    return next(err);
  }
};