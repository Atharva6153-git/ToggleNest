const ActivityLog = require('../models/ActivityLog');
const Task = require('../models/Task');
const {
  authorizeProject,
  getAccessibleProjectIds,
  resolveActor,
  isValidId,
} = require('../utils/accessControl');

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { project } = req.query;
    const actor = await resolveActor(req);
    const filter = {};

    if (project) {
      if (!isValidId(project)) {
        const error = new Error('Invalid project id');
        error.statusCode = 400;
        return next(error);
      }

      const { allowed } = await authorizeProject(project, req);
      if (!allowed) {
        const error = new Error('Not authorized to view activity for this project');
        error.statusCode = 403;
        return next(error);
      }

      const taskIds = await Task.find({ project: { $eq: project } }).select('_id');
      if (!taskIds.length) {
        return res.json({ success: true, data: [] });
      }
      filter.task = { $in: taskIds.map((task) => task._id) };
    } else if (!actor.isAdmin) {
      const accessibleProjectIds = await getAccessibleProjectIds(req);
      const taskIds = await Task.find({
        $or: [
          { project: { $in: accessibleProjectIds } },
          { createdBy: actor.id },
          { assignedTo: actor.id },
        ],
      }).select('_id');

      filter.$or = [
        { task: { $in: taskIds.map((task) => task._id) } },
        { performedBy: actor.id },
      ];
    }

    const logs = await ActivityLog.find(filter)
      .populate('performedBy', 'name email profilePicture role')
      .populate('task', 'title')
      .sort({ timestamp: -1 });

    return res.json({ success: true, data: logs });
  } catch (err) {
    return next(err);
  }
};
