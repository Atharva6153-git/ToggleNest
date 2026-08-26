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
    data.createdBy = req.user._id;
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
    const { page = 1, limit = 20, search } = req.query;
    const filter = { createdBy: req.user._id };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(filter).lean().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Project.countDocuments(filter),
    ]);

    return res.json({
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('getProjects error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }
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
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    const data = pick(req.body, UPDATE_FIELDS);
    const updated = await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
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
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    await Project.findByIdAndDelete(id);
    return res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid project id' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
