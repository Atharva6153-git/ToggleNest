const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
  next();
});

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const activityLogRoutes = require('../routes/activityLogRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/activity-logs', activityLogRoutes);
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
    Task.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  await User.create({
    name: 'Alice Admin',
    email: 'alice@example.com',
    password: 'hashed',
    role: 'admin',
    _id: '507f1f77bcf86cd799439011',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Activity log controller', () => {
  it('returns all logs when no project filter is provided', async () => {
    const project = await Project.create({
      name: 'Filtered Project',
      createdBy: '507f1f77bcf86cd799439011',
    });
    const [taskA, taskB] = await Task.insertMany([
      { title: 'Task A', project: project._id },
      { title: 'Task B', project: project._id },
    ]);
    await ActivityLog.insertMany([
      { task: taskA._id, action: 'Status changed to Done', performedBy: '507f1f77bcf86cd799439011' },
      { task: taskB._id, action: 'Status changed to In Progress', performedBy: '507f1f77bcf86cd799439011' },
    ]);

    const res = await request(app).get('/api/activity-logs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('filters logs to a single project and populates performer and task', async () => {
    const projectA = await Project.create({
      name: 'Project A',
      createdBy: '507f1f77bcf86cd799439011',
    });
    const projectB = await Project.create({
      name: 'Project B',
      createdBy: '507f1f77bcf86cd799439011',
    });
    const taskA = await Task.create({ title: 'Task A', project: projectA._id });
    const taskB = await Task.create({ title: 'Task B', project: projectB._id });
    await ActivityLog.insertMany([
      { task: taskA._id, action: 'Status changed to Done', performedBy: '507f1f77bcf86cd799439011' },
      { task: taskB._id, action: 'Status changed to In Progress', performedBy: '507f1f77bcf86cd799439011' },
    ]);

    const res = await request(app).get(`/api/activity-logs?project=${projectA._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].task.title).toBe('Task A');
    expect(res.body.data[0].performedBy.name).toBe('Alice Admin');
  });

  it('returns an empty list when the project has no tasks', async () => {
    const project = await Project.create({
      name: 'Empty Project',
      createdBy: '507f1f77bcf86cd799439011',
    });

    const res = await request(app).get(`/api/activity-logs?project=${project._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});