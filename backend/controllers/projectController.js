const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');

const CREATE_FIELDS = ['name', 'description', 'deadline', 'members'];
const UPDATE_FIELDS = ['name', 'description', 'deadline', 'members'];

const pick = (source, allowedFields) => {
  const result = {};
  for (const field of allowedFields) {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
  }
  return result;
};

// Every project member plus every admin, minus the actor.
const getProjectAudience = async (project, excludeUserId) => {
  const audience = new Set();
  for (const member of project.members || []) {
    audience.add(String(member));
  }
  const admins = await User.find({ role: 'admin' }).select('_id');
  for (const admin of admins) {
    audience.add(String(admin._id));
  }
  audience.delete(String(excludeUserId));
  return [...audience];
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

const buildProjectChangeDetails = (previous, updated) => {
  const details = [];
  if (!previous || !updated) return details;
  if (previous.name !== updated.name) {
    details.push(`name changed to "${updated.name}"`);
  }
  if (previous.description !== updated.description) {
    details.push('description was updated');
  }
  const prevDeadline = formatDate(previous.deadline);
  const newDeadline = formatDate(updated.deadline);
  if (prevDeadline !== newDeadline) {
    details.push(`deadline changed to ${newDeadline || 'none'}`);
  }
  return details;
};

exports.createProject = async (req, res, next) => {
  try {
    const data = pick(req.body, CREATE_FIELDS);
    data.createdBy = req.user.userId;
    const project = new Project(data);
    const saved = await project.save();

    const members = Array.isArray(data.members) ? data.members : [];
    if (members.length) {
      const recipients = await User.find({
        _id: { $in: members, $ne: req.user.userId },
        role: 'member',
      }).select('_id');
      if (recipients.length) {
        try {
          await Notification.insertMany(
            recipients.map((member) => ({
              recipient: member._id,
              message: `You were added to project: ${saved.name}`,
              type: 'project_assigned',
            }))
          );
        } catch (notifErr) {
          console.error('createProject: error creating notifications', notifErr);
        }
      }
    }

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('createProject error', err);
    return next(err);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.$or = [
        { createdBy: req.user.userId },
        { members: req.user.userId },
      ];
    }

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
      success: true,
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
    return next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('members', 'name email profilePicture role')
      .populate('createdBy', 'name email profilePicture role')
      .lean();
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }
    const isCreator = String(project.createdBy?._id || project.createdBy) === req.user.userId;
    const isMember = (project.members || []).some(
      (m) => String(m._id || m) === req.user.userId
    );
    if (!isCreator && !isMember) {
      const error = new Error('Not authorized to view this project');
      error.statusCode = 403;
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
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isCreator = project.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const data = pick(req.body, UPDATE_FIELDS);
    const previous = {
      name: project.name,
      description: project.description,
      deadline: project.deadline,
    };

    if (data.members) {
      const currentMembers = new Set(
        (project.members || []).map((m) => m.toString())
      );
      const newMembers = data.members.filter(
        (m) => !currentMembers.has(String(m))
      );

      if (newMembers.length > 0) {
        await Notification.create(
          newMembers.map((member) => ({
            recipient: member,
            message: `You were added to project: ${project.name}`,
            type: 'project_assigned',
          }))
        );
      }
    }

    const updated = await Project.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!updated) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }

    const details = buildProjectChangeDetails(previous, updated);
    if (details.length) {
      const audience = await getProjectAudience(updated, req.user.userId);
      await Notification.insertMany(
        audience.map((recipient) => ({
          recipient,
          message: `Project "${updated.name}" was updated: ${details.join(', ')}`,
          type: 'project_updated',
        }))
      );
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
    const project = await Project.findById(id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }
    const isCreator = project.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isCreator && !isAdmin) {
      const error = new Error('Not authorized to delete this project');
      error.statusCode = 403;
      return next(error);
    }

    const audience = await getProjectAudience(project, req.user.userId);
    await Notification.insertMany(
      audience.map((recipient) => ({
        recipient,
        message: `Project "${project.name}" was deleted`,
        type: 'project_deleted',
      }))
    );

    await Project.findByIdAndDelete(id);
    return res.json({ success: true, data: { message: 'Project deleted' } });
  } catch (err) {
    console.error('deleteProject error', err);
    return next(err);
  }
};
