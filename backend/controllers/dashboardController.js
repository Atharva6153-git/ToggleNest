const Task = require('../models/Task');
const {
  authorizeProject,
  getAccessibleProjectIds,
  resolveActor,
  isValidId,
} = require('../utils/accessControl');

exports.getDashboardSummary = async (req, res, next) => {
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
        const error = new Error('Not authorized to view this project');
        error.statusCode = 403;
        return next(error);
      }

      filter.project = { $eq: project };
    } else if (!actor.isAdmin) {
      const accessibleProjectIds = await getAccessibleProjectIds(req);
      filter.$or = [
        { project: { $in: accessibleProjectIds } },
        { createdBy: actor.id },
        { assignedTo: actor.id },
      ];
    }

    const tasks = await Task.find(filter);

    const statusCounts = {
      'To-Do': 0,
      'In Progress': 0,
      Done: 0,
    };

    const priorityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    tasks.forEach((task) => {
      if (task.status && statusCounts[task.status] !== undefined) {
        statusCounts[task.status] += 1;
      }

      if (task.priority && priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority] += 1;
      }
    });

    const totalTasks = tasks.length;
    const doneTasks = statusCounts.Done || 0;
    const completionPercentage =
      totalTasks === 0 ? 0 : Number(((doneTasks / totalTasks) * 100).toFixed(2));

    const now = new Date();
    const overdueTasks = tasks.filter(
      (task) => task.status !== 'Done' && task.dueDate && new Date(task.dueDate) < now
    ).length;

    return res.json({
      success: true,
      data: {
        totalTasks,
        tasksByStatus: statusCounts,
        tasksByPriority: priorityCounts,
        completionPercentage,
        overdueTasks,
      },
    });
  } catch (err) {
    return next(err);
  }
};
