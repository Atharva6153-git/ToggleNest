const Project = require('../models/Project');

/**
 * Pick only allowed keys from an object.
 * Prevents mass-assignment of unintended fields.
 */
function pick(obj, allowedKeys) {
  const result = {};
  for (const key of allowedKeys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

const CREATE_FIELDS = ['name', 'description', 'deadline'];
const UPDATE_FIELDS = ['name', 'description', 'deadline', 'members'];

exports.createProject = async (req, res) => {
  try {
    const data = pick(req.body, CREATE_FIELDS);
    const project = new Project(data);
    const saved = await project.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('createProject error', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: `Invalid ${err.path}` });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    return res.json(projects);
  } catch (err) {
    console.error('getProjects error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    return res.json(project);
  } catch (err) {
    console.error('getProjectById error', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = pick(req.body, UPDATE_FIELDS);
    const updated = await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateProject error', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: `Invalid ${err.path}` });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Project not found' });
    return res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
