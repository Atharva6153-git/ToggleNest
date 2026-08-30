const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: '507f1f77bcf86cd799439011' };
  next();
});

const Task = require('../models/Task');
const taskRoutes = require('../routes/taskRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/tasks', taskRoutes);
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
});

beforeEach(async () => {
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Task controller', () => {
  it('creates a task', async () => {
    const payload = {
      title: 'Write API docs',
      description: 'Document all task routes',
      status: 'To-Do',
      priority: 'High',
      dueDate: '2026-09-10T00:00:00.000Z',
    };

    const res = await request(app).post('/api/tasks').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(payload.title);
    expect(res.body.data.status).toBe('To-Do');
    expect(res.body.data.priority).toBe('High');
  });

  it('gets all tasks with pagination metadata', async () => {
    await Task.insertMany([
      { title: 'Task 1', status: 'To-Do', priority: 'Low' },
      { title: 'Task 2', status: 'In Progress', priority: 'Medium' },
    ]);

    const res = await request(app).get('/api/tasks?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('gets a task by id', async () => {
    const task = await Task.create({
      title: 'Fetch single task',
      status: 'Done',
      priority: 'Medium',
    });

    const res = await request(app).get(`/api/tasks/${task._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(task._id.toString());
    expect(res.body.data.title).toBe(task.title);
  });

  it('updates a task', async () => {
    const task = await Task.create({
      title: 'Initial title',
      description: 'Old description',
      status: 'To-Do',
      priority: 'Low',
    });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .send({
        title: 'Updated task title',
        description: 'New description',
        priority: 'High',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated task title');
    expect(res.body.data.description).toBe('New description');
    expect(res.body.data.priority).toBe('High');
  });

  it('deletes a task', async () => {
    const task = await Task.create({
      title: 'Delete me',
      status: 'To-Do',
      priority: 'Low',
    });

    const res = await request(app).delete(`/api/tasks/${task._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Task deleted');

    const saved = await Task.findById(task._id);
    expect(saved).toBeNull();
  });

  it('updates a task status', async () => {
    const task = await Task.create({
      title: 'Status update task',
      status: 'To-Do',
      priority: 'Medium',
    });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}/status`)
      .send({ status: 'Done' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Done');

    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.status).toBe('Done');
  });
});
