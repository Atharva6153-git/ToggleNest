const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const isPlainObject = (value) => (
  !!value && typeof value === 'object' && !Array.isArray(value)
);

const getLiteralString = (value) => (
  typeof value === 'string' ? value.trim() : ''
);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRole = async (userId) => {
  if (!userId) return null;
  try {
    return await User.findById(userId).select('role name');
  } catch {
    return null;
  }
};

// All users who should hear about changes to a project's tasks:
// everyone listed on the project (members) plus every admin, minus the actor.
const getProjectRecipients = async (projectId, excludeUserId) => {
  const recipientSet = new Set();

  if (projectId) {
    const project = await Project.findById(projectId).select('members');
    if (project && project.members) {
      for (const memberId of project.members) {
        recipientSet.add(String(memberId));
      }
    }
  }

  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const admin of admins) {
    recipientSet.add(String(admin._id));
  }

  if (excludeUserId) {
    recipientSet.delete(String(excludeUserId));
  }

  return [...recipientSet];
};

const createNotifications = async (notifications) => {
  if (!notifications || !notifications.length) return;
  try {
    await Notification.insertMany(notifications);
  } catch (notifErr) {
    console.error('error creating notifications:', notifErr);
  }
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

// Human-readable list of what changed on a task update.
const buildTaskChangeDetails = (previous, updated) => {
  const details = [];
  if (previous && updated) {
    if (previous.title !== updated.title) {
      details.push(`title changed to "${updated.title}"`);
    }
    if (previous.status !== updated.status) {
      details.push(`status changed to ${updated.status}`);
    }
    if (previous.priority !== updated.priority) {
      details.push(`priority changed to ${updated.priority}`);
    }
    const prevDue = formatDate(previous.dueDate);
    const newDue = formatDate(updated.dueDate);
    if (prevDue !== newDue) {
      details.push(`due date changed to ${newDue || 'none'}`);
    }
    if (previous.description !== updated.description) {
      details.push('description was updated');
    }
    if (
      String(previous.assignedTo || '') !== String(updated.assignedTo || '')
    ) {
      details.push('assignee was changed');
    }
  }
  if (!details.length) {
    details.push('details were updated');
  }
  return details;
};

exports.createTask = async (req, res, next) => {
  try {
    const task = new Task(req.body);
    task.createdBy = req.user?.userId;
    const saved = await task.save();

    const actor = await getRole(req.user?.userId);
    const actorName = actor?.name || 'A member';

    const recipientIds = await getProjectRecipients(saved.project, actor?._id);
    const notifications = recipientIds
      .filter((recipient) => !saved.assignedTo || recipient !== String(saved.assignedTo))
      .map((recipient) => ({
        recipient,
        message: `${actorName} created a new task "${saved.title}"`,
        type: 'task_created',
        relatedTask: saved._id,
      }));

    if (saved.assignedTo && String(saved.assignedTo) !== String(actor?._id)) {
      notifications.push({
        recipient: saved.assignedTo,
        message: `You were assigned to task: ${saved.title}`,
        type: 'task_assigned',
        relatedTask: saved._id,
      });
    }

    await createNotifications(notifications);
    console.log('createTask: notifications created for', notifications.length, 'recipient(s)');

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

    const projectValue = getLiteralString(project);
    const priorityValue = getLiteralString(priority);
    const statusValue = getLiteralString(status);
    const assignedToValue = getLiteralString(assignedTo);
    const searchValue = getLiteralString(search);

    if (!projectValue || !mongoose.isValidObjectId(projectValue)) {
      const error = new Error('Valid project id is required');
      error.statusCode = 400;
      return next(error);
    }

    filter.project = { $eq: projectValue };
    if (priorityValue) filter.priority = { $eq: priorityValue };
    if (statusValue) filter.status = { $eq: statusValue };
    if (assignedToValue) filter.assignedTo = { $eq: assignedToValue };

    if (searchValue) {
      filter.title = { $regex: escapeRegex(searchValue), $options: 'i' };
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
    if (!isPlainObject(req.body)) {
      const error = new Error('Invalid request body');
      error.statusCode = 400;
      return next(error);
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo', 'project'];
    const updatePayload = {};
    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;
      const value = req.body[field];
      if (value === null || typeof value === 'string') {
        updatePayload[field] = value;
        continue;
      }
      const error = new Error(`Invalid value for "${field}"`);
      error.statusCode = 400;
      return next(error);
    }

    const previous = await Task.findById(id).select(
      'title description status priority dueDate assignedTo project'
    );

    const updated = await Task.findOneAndUpdate({ _id: { $eq: id } }, { $set: updatePayload }, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!updated) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      return next(error);
    }

    const actor = await getRole(req.user?.userId);
    const actorName = actor?.name || 'A member';

    const recipientIds = await getProjectRecipients(updated.project, actor?._id);
    const details = buildTaskChangeDetails(previous, updated);
    const notifications = recipientIds
      .filter((recipient) => !updated.assignedTo || recipient !== String(updated.assignedTo))
      .map((recipient) => ({
        recipient,
        message: `${actorName} updated task "${updated.title}": ${details.join(', ')}`,
        type: 'task_updated',
        relatedTask: updated._id,
      }));

    const previousAssignee = previous?.assignedTo?.toString();
    const newAssigneeId = updated.assignedTo?.toString();
    if (
      newAssigneeId &&
      newAssigneeId !== previousAssignee &&
      newAssigneeId !== String(actor?._id)
    ) {
      notifications.push({
        recipient: newAssigneeId,
        message: `You were assigned to task: ${updated.title}`,
        type: 'task_assigned',
        relatedTask: updated._id,
      });
    }

    await createNotifications(notifications);

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

    const actor = await getRole(req.user?.userId);
    const actorName = actor?.name || 'A member';

    const recipientIds = await getProjectRecipients(deleted.project, actor?._id);
    await createNotifications(
      recipientIds.map((recipient) => ({
        recipient,
        message: `${actorName} deleted task "${deleted.title}"`,
        type: 'task_deleted',
        relatedTask: deleted._id,
      }))
    );

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

    const previous = await Task.findById(id).select('status title project assignedTo');

    const updated = await Task.findOneAndUpdate(
      { _id: { $eq: id } },
      { $set: { status } },
      { returnDocument: 'after', runValidators: true }
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

    const actor = await getRole(actorId);
    const actorName = actor?.name || 'A member';

    const recipientIds = await getProjectRecipients(updated.project, actor?._id);
    const previousStatus = previous?.status;

    if (actor?.role === 'member' && status === 'Done') {
      await createNotifications(
        recipientIds.map((recipient) => ({
          recipient,
          message: `${actorName} completed the task "${updated.title}"`,
          type: 'task_completed',
          relatedTask: updated._id,
        }))
      );
    } else {
      await createNotifications(
        recipientIds.map((recipient) => ({
          recipient,
          message: previousStatus && previousStatus !== status
            ? `${actorName} moved task "${updated.title}" from ${previousStatus} to ${status}`
            : `${actorName} changed task "${updated.title}" status to ${status}`,
          type: 'status_changed',
          relatedTask: updated._id,
        }))
      );
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateTaskStatus error', err);
    return next(err);
  }
};
