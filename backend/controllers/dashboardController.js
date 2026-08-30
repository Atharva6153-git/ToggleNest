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

    const totalTasks = tasks.length;
    const doneTasks = statusCounts['Done'] || 0;
    const completionPercentage = totalTasks === 0 ? 0 : Number(((doneTasks / totalTasks) * 100).toFixed(2));

    return res.json({
      success: true,
      data: {
        totalTasks,
        tasksByStatus: statusCounts,
        tasksByPriority: priorityCounts,
        completionPercentage,
      },
    });
  } catch (err) {
    console.error('getDashboardSummary error', err);
    return next(err);
  }
};
