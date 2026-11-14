const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mockAuthUser = null;

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  if (!mockAuthUser) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Authentication required.',
    });
  }

  req.user = mockAuthUser;
  return next();
});

jest.mock('../config/firebaseAdmin', () => ({
  getApps: jest.fn(() => []),
  getAuth: jest.fn(),
}));

jest.mock('../config/cloudinary', () => ({
  single: jest.fn(() => (req, res, next) => next()),
}));

const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
});

beforeEach(async () => {
  mockAuthUser = null;
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

const createUsers = async () => {
  const originalAdmin = await User.create({
    name: 'Original Admin',
    email: 'original@example.com',
    password: 'hashed-password',
    role: 'admin',
    createdAt: new Date('2026-01-01'),
  });
  const secondAdmin = await User.create({
    name: 'Second Admin',
    email: 'second@example.com',
    password: 'hashed-password',
    role: 'admin',
    createdAt: new Date('2026-01-02'),
  });
  const member = await User.create({
    name: 'Member',
    email: 'member@example.com',
    password: 'hashed-password',
    role: 'member',
    createdAt: new Date('2026-01-03'),
  });

  return { originalAdmin, secondAdmin, member };
};

const authenticateAs = (user) => {
  mockAuthUser = {
    userId: user._id.toString(),
    role: user.role,
  };
};

describe('User management routes', () => {
  it('allows an admin to list users with management fields', async () => {
    const { originalAdmin, member } = await createUsers();
    authenticateAs(originalAdmin);

    const res = await request(app).get('/api/auth/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    const listedOriginalAdmin = res.body.data.find(
      (user) => user.email === 'original@example.com'
    );
    expect(listedOriginalAdmin).toEqual(
      expect.objectContaining({
        name: 'Original Admin',
        email: 'original@example.com',
        role: 'admin',
        createdAt: expect.any(String),
      })
    );
    expect(listedOriginalAdmin.password).toBeUndefined();
    expect(res.body.data.some((user) => user._id === member._id.toString())).toBe(true);
  });

  it('rejects unauthenticated and member access to the admin user list', async () => {
    const { member } = await createUsers();

    const unauthenticatedResponse = await request(app).get('/api/auth/users');
    expect(unauthenticatedResponse.status).toBe(401);

    authenticateAs(member);
    const memberResponse = await request(app).get('/api/auth/users');
    expect(memberResponse.status).toBe(403);
  });

  it('allows an admin to promote a member', async () => {
    const { originalAdmin, member } = await createUsers();
    authenticateAs(originalAdmin);

    const res = await request(app)
      .patch(`/api/auth/users/${member._id}/role`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
    await expect(User.findById(member._id).select('role')).resolves.toMatchObject({
      role: 'admin',
    });
  });

  it('allows an admin to demote another non-original admin', async () => {
    const { originalAdmin, secondAdmin } = await createUsers();
    authenticateAs(originalAdmin);

    const res = await request(app)
      .patch(`/api/auth/users/${secondAdmin._id}/role`)
      .send({ role: 'member' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('member');
  });

  it('prevents demoting the original admin', async () => {
    const { originalAdmin, secondAdmin } = await createUsers();
    authenticateAs(secondAdmin);

    const res = await request(app)
      .patch(`/api/auth/users/${originalAdmin._id}/role`)
      .send({ role: 'member' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('The original admin cannot be demoted');
  });

  it('prevents demoting the last remaining admin', async () => {
    const { originalAdmin } = await createUsers();
    await User.updateOne({ _id: originalAdmin._id }, { role: 'member' });
    const onlyAdmin = await User.findOne({ role: 'admin' });
    await User.updateMany({}, { role: 'member' });
    await User.updateOne({ _id: onlyAdmin._id }, { role: 'admin' });
    authenticateAs(onlyAdmin);

    const res = await request(app)
      .patch(`/api/auth/users/${onlyAdmin._id}/role`)
      .send({ role: 'member' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot demote the last remaining admin');
  });
});
