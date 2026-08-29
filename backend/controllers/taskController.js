const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    const saved = await task.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('createTask error', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { project } = req.query;
    const filter = {};
    if (project) filter.project = project;
    const tasks = await Task.find(filter).populate('assignedTo', 'name email');
    return res.json(tasks);
  } catch (err) {
    console.error('getTasks error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json(task);
  } catch (err) {
    console.error('getTaskById error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateTask error', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('deleteTask error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update only the status field of a task
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['To-Do', 'In Progress', 'Done'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Task not found' });

    const actorId = req.user?.userId || req.user?._id;
    if (actorId) {
      await ActivityLog.create({
        task: id,
        action: `Status changed to ${status}`,
        performedBy: actorId,
        timestamp: new Date(),
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error('updateTaskStatus error', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
