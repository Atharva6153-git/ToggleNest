const Project = require('../models/Project');

exports.createProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    const saved = await project.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('createProject error', err);
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
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateProject error', err);
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
    return res.status(500).json({ message: 'Server error' });
  }
};
