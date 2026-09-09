const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439011' };
  next();
});

const Project = require('../models/Project');
const projectRoutes = require('../routes/projectRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/projects', projectRoutes);
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
});

beforeEach(async () => {
  await Project.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Project controller', () => {
  it('creates a project', async () => {
    const payload = {
      name: 'ToggleNest Dashboard',
      description: 'Manage projects efficiently',
      deadline: '2026-12-31T00:00:00.000Z',
    };

    const res = await request(app).post('/api/projects').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(payload.name);
    expect(res.body.data.description).toBe(payload.description);
    expect(res.body.data.createdBy.toString()).toBe('507f1f77bcf86cd799439011');
  });

  it('gets projects with pagination metadata', async () => {
    await Project.insertMany([
      { name: 'Project 1', createdBy: '507f1f77bcf86cd799439011' },
      { name: 'Project 2', createdBy: '507f1f77bcf86cd799439011' },
    ]);

    const res = await request(app).get('/api/projects?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('updates a project', async () => {
    const project = await Project.create({
      name: 'Old name',
      description: 'Old description',
      createdBy: '507f1f77bcf86cd799439011',
    });

    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .send({ name: 'New name', description: 'New description' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New name');
    expect(res.body.data.description).toBe('New description');
  });

  it('deletes a project', async () => {
    const project = await Project.create({
      name: 'Delete me',
      createdBy: '507f1f77bcf86cd799439011',
    });

    const res = await request(app).delete(`/api/projects/${project._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await Project.findById(project._id);
    expect(saved).toBeNull();
  });
});