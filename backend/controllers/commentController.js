const Comment = require('../models/Comment');
const Project = require('../models/Project');
const { authorizeProject, resolveActor, isValidId } = require('../utils/accessControl');

const getLiteralString = (value) => (typeof value === 'string' ? value.trim() : '');

exports.getComments = async (req, res, next) => {
  try {
    const projectId = getLiteralString(req.query.project);

    if (!projectId || !isValidId(projectId)) {
      const error = new Error('Valid project id is required');
      error.statusCode = 400;
      return next(error);
    }

    const { allowed } = await authorizeProject(projectId, req);
    if (!allowed) {
      const error = new Error('Not authorized to view comments in this project');
      error.statusCode = 403;
      return next(error);
    }

    const comments = await Comment.find({ project: { $eq: projectId } })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (err) {
    return next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const projectId = getLiteralString(req.body?.project);
    const rawText = req.body?.text;

    if (!projectId || !isValidId(projectId)) {
      const error = new Error('Valid project id is required');
      error.statusCode = 400;
      return next(error);
    }

    if (typeof rawText !== 'string' || !rawText.trim()) {
      const error = new Error('Comment text is required');
      error.statusCode = 400;
      return next(error);
    }

    if (rawText.trim().length > 1000) {
      const error = new Error('Comment cannot exceed 1000 characters');
      error.statusCode = 400;
      return next(error);
    }

    const projectExists = await Project.exists({ _id: { $eq: projectId } });
    if (!projectExists) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      return next(error);
    }

    const { allowed } = await authorizeProject(projectId, req);
    if (!allowed) {
      const error = new Error('Not authorized to comment on this project');
      error.statusCode = 403;
      return next(error);
    }

    const comment = new Comment({
      project: projectId,
      author: req.user?.userId,
      text: rawText.trim(),
    });

    const saved = await comment.save();
    await saved.populate('author', 'name profilePicture');

    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    return next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !isValidId(id)) {
      const error = new Error('Invalid comment id');
      error.statusCode = 400;
      return next(error);
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      return next(error);
    }

    const actor = await resolveActor(req);
    const isAuthor = String(comment.author) === actor.id;

    if (!isAuthor && !actor.isAdmin) {
      const error = new Error('You can only delete your own comments');
      error.statusCode = 403;
      return next(error);
    }

    await Comment.findByIdAndDelete(id);

    return res.json({ success: true, data: { message: 'Comment deleted' } });
  } catch (err) {
    return next(err);
  }
};
