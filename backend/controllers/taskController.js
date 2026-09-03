const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

exports.createTask = async (req, res, next) => {
  try {
    console.log('createTask body:', req.body);
    const task = new Task(req.body);
    task.createdBy = req.user?.userId;
    const saved = await task.save();

    if (saved.assignedTo) {
      try {
        await Notification.create({
          recipient: saved.assignedTo,
          message: `You were assigned to task: ${saved.title}`,
          type: 'task_assigned',
          relatedTask: saved._id,
        });
        console.log('createTask: notification created for assignedTo', saved.assignedTo);
      } catch (notifErr) {
        console.error('createTask: error creating notification', notifErr);
      }
    }

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('createTask error', err);
    return next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { project, page = 1, limit = 10, search, priority, status, assignedTo } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email')
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }),
      Task.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    console.error('getTasks error', err);
    return next(err);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('assignedTo', 'name email');
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }
    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('getTaskById error', err);
    return next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateTask error', err);
    return next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }
    return res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (err) {
    console.error('deleteTask error', err);
    return next(err);
  }
};

// Update only the status field of a task
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['To-Do', 'In Progress', 'Done'];
    if (!status || !allowed.includes(status)) {
      const error = new Error(`Status must be one of: ${allowed.join(', ')}`);
      error.statusCode = 400;
      return next(error);
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    const actorId = req.user?.userId || req.user?._id;
    if (actorId) {
      await ActivityLog.create({
        task: id,
        action: `Status changed to ${status}`,
        performedBy: actorId,
        timestamp: new Date(),
      });
    }

    if (updated.assignedTo && String(actorId) !== String(updated.assignedTo)) {
      await Notification.create({
        recipient: updated.assignedTo,
        message: `Task "${updated.title}" status changed to ${status}`,
        type: 'status_changed',
        relatedTask: updated._id,
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateTaskStatus error', err);
    return next(err);
  }
};
