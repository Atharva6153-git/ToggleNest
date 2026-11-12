const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');

const toId = (value) => String(value?._id || value || '');

const isValidId = (value) => Boolean(value) && mongoose.isValidObjectId(value);

/**
 * Resolve the acting user from the request. The JWT role is trusted, but a
 * fresh database lookup is used whenever possible so demoted admins lose
 * privileged access immediately.
 */
const resolveActor = async (req) => {
  const id = toId(req.user?.userId || req.user?._id);
  let role = req.user?.role || 'member';

  if (id && isValidId(id)) {
    try {
      const user = await User.findById(id).select('role');
      if (user?.role) role = user.role;
    } catch {
      // Fall back to the signed token role.
    }
  }

  return { id, role, isAdmin: role === 'admin' };
};

const isProjectMember = (project, userId) => {
  if (!project || !userId) return false;
  if (toId(project.createdBy) === userId) return true;
  return (project.members || []).some((member) => toId(member) === userId);
};

/**
 * @returns {Promise<{actor: object, project: object|null, allowed: boolean}>}
 */
const authorizeProject = async (projectId, req) => {
  const actor = await resolveActor(req);

  if (!projectId) {
    return { actor, project: null, allowed: actor.isAdmin };
  }

  const normalizedProjectId = toId(projectId);
  if (!isValidId(normalizedProjectId)) {
    return { actor, project: null, allowed: false };
  }

  const project = await Project.findOne({ _id: { $eq: normalizedProjectId } }).select(
    'members createdBy'
  );

  if (!project) {
    // Admins may operate on records that no longer exist (keeps delete flows
    // and admin tooling usable); everyone else gets a clean 403/404 upstream.
    return { actor, project: null, allowed: actor.isAdmin };
  }

  return {
    actor,
    project,
    allowed: actor.isAdmin || isProjectMember(project, actor.id),
  };
};

const authorizeTask = async (task, req, actor) => {
  const resolvedActor = actor || (await resolveActor(req));

  if (!task) return { actor: resolvedActor, allowed: false };

  if (resolvedActor.isAdmin) return { actor: resolvedActor, allowed: true };

  const ownsTask =
    toId(task.createdBy) === resolvedActor.id ||
    toId(task.assignedTo) === resolvedActor.id;

  if (ownsTask) return { actor: resolvedActor, allowed: true };

  if (!task.project) return { actor: resolvedActor, allowed: false };

  const { allowed } = await authorizeProject(task.project, req);
  return { actor: resolvedActor, allowed };
};

/** @returns {Promise<null | string[]>} `null` means "all projects" (admin). */
const getAccessibleProjectIds = async (req) => {
  const actor = await resolveActor(req);
  if (actor.isAdmin) return null;
  if (!isValidId(actor.id)) return [];

  const projects = await Project.find({
    $or: [{ createdBy: actor.id }, { members: actor.id }],
  }).select('_id');

  return projects.map((project) => String(project._id));
};

module.exports = {
  toId,
  isValidId,
  resolveActor,
  isProjectMember,
  authorizeProject,
  authorizeTask,
  getAccessibleProjectIds,
};
