const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mockCurrentUserId = '507f1f77bcf86cd799439011';
let mockCurrentRole = 'admin';

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: mockCurrentUserId, role: mockCurrentRole };
  next();
});

const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const commentRoutes = require('../routes/commentRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/comments', commentRoutes);
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Comment.deleteMany({}),
  ]);

  mockCurrentUserId = '507f1f77bcf86cd799439011';
  mockCurrentRole = 'admin';

  await User.create({
    name: 'Alice Admin',
    email: 'alice@example.com',
    password: 'hashed',
    role: 'admin',
    _id: mockCurrentUserId,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Comment controller', () => {
  it('returns 400 when no project id is provided (undefined id case)', async () => {
    const res = await request(app).get('/api/comments');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Valid project id is required');
  });

  it('returns comments for a project, populated with the author, oldest first', async () => {
    const project = await Project.create({
      name: 'Website Redesign',
      createdBy: mockCurrentUserId,
    });

    const older = await Comment.create({
      project: project._id,
      author: mockCurrentUserId,
      text: 'First comment',
    });
    const newer = await Comment.create({
      project: project._id,
      author: mockCurrentUserId,
      text: 'Second comment',
    });
    await Comment.create({
      project: new mongoose.Types.ObjectId(),
      author: mockCurrentUserId,
      text: 'Other project comment',
    });

    const res = await request(app).get(
      `/api/comments?project=${project._id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]._id.toString()).toBe(older._id.toString());
    expect(res.body.data[1]._id.toString()).toBe(newer._id.toString());
    expect(res.body.data[0].author.name).toBe('Alice Admin');
    expect(res.body.data[0].text).toBe('First comment');
  });

  it('creates a comment with the logged-in user as author', async () => {
    const project = await Project.create({
      name: 'Website Redesign',
      createdBy: mockCurrentUserId,
    });

    const res = await request(app)
      .post('/api/comments')
      .send({ project: project._id, text: 'Looking good!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.text).toBe('Looking good!');
    expect(res.body.data.project.toString()).toBe(project._id.toString());
    expect(res.body.data.author._id.toString()).toBe(mockCurrentUserId);
    expect(res.body.data.author.name).toBe('Alice Admin');

    const saved = await Comment.findById(res.body.data._id);
    expect(saved).not.toBeNull();
  });

  it('returns 400 when posting without a project id', async () => {
    const res = await request(app)
      .post('/api/comments')
      .send({ text: 'No project here' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Valid project id is required');
  });

  it('allows the comment author to delete the comment', async () => {
    const project = await Project.create({
      name: 'Website Redesign',
      createdBy: mockCurrentUserId,
    });

    const comment = await Comment.create({
      project: project._id,
      author: mockCurrentUserId,
      text: 'To be deleted',
    });

    const res = await request(app).delete(`/api/comments/${comment._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await Comment.findById(comment._id);
    expect(saved).toBeNull();
  });

  it('forbids a non-author member from deleting the comment', async () => {
    const project = await Project.create({
      name: 'Website Redesign',
      createdBy: mockCurrentUserId,
    });

    const comment = await Comment.create({
      project: project._id,
      author: mockCurrentUserId,
      text: 'Alice comment',
    });

    mockCurrentUserId = '507f1f77bcf86cd799439022';
    mockCurrentRole = 'member';

    const res = await request(app).delete(`/api/comments/${comment._id}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You can only delete your own comments');

    const saved = await Comment.findById(comment._id);
    expect(saved).not.toBeNull();
  });
});
