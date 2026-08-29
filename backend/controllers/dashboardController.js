const Task = require('../models/Task');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const { project } = req.query;
    const filter = {};

    if (project) {
      filter.project = project;
    }

    const tasks = await Task.find(filter);

    const statusCounts = {
      'To-Do': 0,
      'In Progress': 0,
      'Done': 0,
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

    return res.json({
      success: true,
      data: {
        totalTasks: tasks.length,
        tasksByStatus: statusCounts,
        tasksByPriority: priorityCounts,
      },
    });
  } catch (err) {
    console.error('getDashboardSummary error', err);
    return next(err);
  }
};
