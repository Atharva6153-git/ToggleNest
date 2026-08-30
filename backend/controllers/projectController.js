const Project = require('../models/Project');

exports.createProject = async (req, res, next) => {
  try {
    const project = new Project(req.body);
    const saved = await project.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('createProject error', err);
    return next(err);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find();
    return res.json({ success: true, data: projects });
  } catch (err) {
    console.error('getProjects error', err);
    return next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }
    return res.json({ success: true, data: project });
  } catch (err) {
    console.error('getProjectById error', err);
    return next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateProject error', err);
    return next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }
    return res.json({ success: true, data: { message: 'Project deleted' } });
  } catch (err) {
    console.error('deleteProject error', err);
    return next(err);
  }
};
