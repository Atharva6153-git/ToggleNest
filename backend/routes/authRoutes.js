const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getAuth, getApps } = require('../config/firebaseAdmin');
const { config } = require('../config/env');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../config/cloudinary');
const { authLimiter, uploadLimiter, dailyUploadBudget } = require('../middleware/rateLimiters');
const {
  setSessionCookie,
  clearSessionCookie,
  setCsrfCookie,
  getCsrfCookie,
} = require('../utils/cookies');

const router = express.Router();

const getNormalizedEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
  profileComplete: user.profileComplete,
  jobTitle: user.jobTitle,
  bio: user.bio,
  createdAt: user.createdAt,
});

const signSessionToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwtExpiresIn,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }
  );

const issueSession = (res, user) => {
  const token = signSessionToken(user);
  setSessionCookie(res, token);
  // Rotate the CSRF token whenever a new authenticated session starts.
  setCsrfCookie(res);
  return token;
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  return next();
};

const emailRule = body('email')
  .isString()
  .withMessage('Email is required')
  .bail()
  .trim()
  .isEmail()
  .withMessage('Email must be a valid email address')
  .isLength({ max: 254 })
  .withMessage('Email cannot exceed 254 characters');

const strongPasswordRule = body('password')
  .isString()
  .withMessage('Password is required')
  .bail()
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new member account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: John Doe }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation failed or user already exists }
 *       429: { description: Too many authentication attempts }
 */
router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .isString()
      .withMessage('Name is required')
      .bail()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    emailRule,
    strongPasswordRule,
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { name, password } = req.body;
      const email = getNormalizedEmail(req.body.email);

      const existingUser = await User.findOne({ email: { $eq: email } });
      if (existingUser) {
        const error = new Error('User already exists');
        error.statusCode = 400;
        return next(error);
      }

      const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);
      const user = new User({
        name: name.trim(),
        email,
        password: hashedPassword,
        // Never allow a role to be self-assigned at registration.
        role: 'member',
      });

      await user.save();

      return res.status(201).json({
        success: true,
        data: { message: 'User registered successfully' },
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive an httpOnly session cookie (and optionally a JWT)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Invalid email or password }
 *       429: { description: Too many authentication attempts }
 */
router.post(
  '/login',
  authLimiter,
  [
    emailRule,
    body('password')
      .isString()
      .withMessage('Password is required')
      .bail()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ max: 128 })
      .withMessage('Password is too long'),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { password } = req.body;
      const email = getNormalizedEmail(req.body.email);

      const user = await User.findOne({ email: { $eq: email } }).select('+password');
      if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 400;
        return next(error);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 400;
        return next(error);
      }

      const token = issueSession(res, user);

      return res.json({
        success: true,
        data: {
          message: 'Login successful',
          ...(config.returnTokenInBody ? { token } : {}),
          user: publicUser(user),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/firebase-login:
 *   post:
 *     summary: Verify a Firebase ID token and create an app session
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Missing or invalid idToken }
 *       401: { description: Invalid or expired Firebase ID token }
 *       429: { description: Too many authentication attempts }
 */
router.post(
  '/firebase-login',
  authLimiter,
  [
    body('idToken')
      .isString()
      .withMessage('idToken is required')
      .bail()
      .notEmpty()
      .withMessage('idToken is required')
      .isLength({ max: 8192 })
      .withMessage('idToken is too long'),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { idToken } = req.body;

      if (!getApps().length) {
        const error = new Error(
          'Firebase login is not configured on the server. The service account file is missing.'
        );
        error.statusCode = 500;
        return next(error);
      }

      const decodedToken = await getAuth().verifyIdToken(idToken);
      if (!decodedToken.email) {
        const error = new Error('Firebase account has no verified email address');
        error.statusCode = 400;
        return next(error);
      }

      const email = decodedToken.email.toLowerCase();
      const name = decodedToken.name || email.split('@')[0];

      let user = await User.findOne({ email: { $eq: email } });

      if (!user) {
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, config.bcryptRounds);

        user = new User({
          name,
          email,
          password: hashedPassword,
          role: 'member',
        });

        await user.save();
      }

      const token = issueSession(res, user);

      return res.json({
        success: true,
        data: {
          message: 'Firebase login successful',
          ...(config.returnTokenInBody ? { token } : {}),
          user: publicUser(user),
        },
      });
    } catch (error) {
      if (error?.code?.startsWith?.('auth/')) {
        error.statusCode = 401;
        error.message = 'Invalid or expired Firebase ID token';
      }
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/csrf:
 *   get:
 *     summary: Get a CSRF token for unsafe requests
 *     tags: [Auth]
 *     responses:
 *       200: { description: CSRF token }
 */
router.get('/csrf', (req, res) => {
  const csrfToken = getCsrfCookie(req) || setCsrfCookie(res);
  return res.json({ success: true, data: { csrfToken } });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Clear the current session cookie
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  return res.json({ success: true, data: { message: 'Logged out successfully' } });
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: List users for administration
 *     description: Returns all users, including role and joined date, for administrators.
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of users }
 *       401: { description: Not authenticated }
 *       403: { description: Admin role required }
 */
router.get('/users', protect, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email role profilePicture createdAt')
      .sort({ name: 1 });
    return res.json({ success: true, data: users });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/users/assignees:
 *   get:
 *     summary: List users for assignee pickers
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of users }
 *       401: { description: Not authenticated }
 */
router.get('/users/assignees', protect, async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email role profilePicture')
      .sort({ name: 1 });
    return res.json({ success: true, data: users });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/users/{id}/role:
 *   patch:
 *     summary: Change a user's role
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, member] }
 *     responses:
 *       200: { description: User role updated }
 *       400: { description: Invalid role, user id, or last admin protection }
 *       401: { description: Not authenticated }
 *       403: { description: Admin role required }
 *       404: { description: User not found }
 */
router.patch(
  '/users/:id/role',
  protect,
  roleMiddleware('admin'),
  body('role')
    .isString()
    .withMessage('Role is required')
    .bail()
    .isIn(['admin', 'member'])
    .withMessage('Role must be admin or member'),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user id',
        });
      }

      const user = await User.findById(id).select(
        'name email role profilePicture createdAt'
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.role === 'admin' && role === 'member') {
        const adminCount = await User.countDocuments({ role: 'admin' });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote the last remaining admin',
          });
        }

        const originalAdmin = await User.findOne({ role: 'admin' })
          .sort({ createdAt: 1 })
          .select('_id');

        if (originalAdmin && originalAdmin._id.equals(user._id)) {
          return res.status(403).json({
            success: false,
            message: 'The original admin cannot be demoted',
          });
        }
      }

      user.role = role;
      await user.save();

      return res.json({ success: true, data: user });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the current authenticated user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile of the authenticated user }
 *       401: { description: Not authenticated }
 *       404: { description: User not found }
 */
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'name email role profilePicture profileComplete jobTitle bio createdAt'
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    return res.json({
      success: true,
      data: {
        message: 'You accessed a protected route!',
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update the current user's profile
 *     description: Changing the password through this endpoint requires currentPassword and newPassword.
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile updated }
 *       400: { description: Validation failed }
 *       401: { description: Not authenticated }
 */
router.put(
  '/profile',
  protect,
  [
    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string')
      .bail()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('jobTitle')
      .optional()
      .isString()
      .withMessage('Job title must be a string')
      .bail()
      .isLength({ max: 100 })
      .withMessage('Job title cannot exceed 100 characters'),
    body('bio')
      .optional()
      .isString()
      .withMessage('Bio must be a string')
      .bail()
      .isLength({ max: 250 })
      .withMessage('Bio cannot exceed 250 characters'),
    body('currentPassword')
      .optional()
      .isString()
      .withMessage('Current password must be a string')
      .isLength({ max: 128 })
      .withMessage('Current password is too long'),
    body('newPassword')
      .optional()
      .isString()
      .withMessage('New password must be a string')
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters'),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { name, jobTitle, bio, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId).select('+password');

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        return next(error);
      }

      if (name !== undefined) user.name = name.trim();
      if (jobTitle !== undefined) user.jobTitle = jobTitle.trim();
      if (bio !== undefined) user.bio = bio.trim();

      if (newPassword !== undefined) {
        if (!currentPassword) {
          const error = new Error('Current password is required to set a new password');
          error.statusCode = 400;
          return next(error);
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          const error = new Error('Current password is incorrect');
          error.statusCode = 400;
          return next(error);
        }

        user.password = await bcrypt.hash(newPassword, config.bcryptRounds);
      }

      user.profileComplete = Boolean(user.name && user.profilePicture);
      await user.save();

      return res.json({
        success: true,
        data: {
          message: 'Profile updated successfully',
          user: publicUser(user),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change the current user's password
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Password updated successfully }
 *       400: { description: Current password incorrect or new password invalid }
 *       401: { description: Not authenticated }
 */
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword')
      .isString()
      .withMessage('Current password is required')
      .bail()
      .notEmpty()
      .withMessage('Current password is required')
      .isLength({ max: 128 })
      .withMessage('Current password is too long'),
    body('newPassword')
      .isString()
      .withMessage('New password is required')
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters'),
    body('confirmNewPassword')
      .isString()
      .withMessage('Password confirmation is required')
      .bail()
      .notEmpty()
      .withMessage('Password confirmation is required'),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      if (newPassword !== confirmNewPassword) {
        const error = new Error('New password and confirmation do not match');
        error.statusCode = 400;
        return next(error);
      }

      const user = await User.findById(req.user.userId).select('+password');
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        return next(error);
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.statusCode = 400;
        return next(error);
      }

      user.password = await bcrypt.hash(newPassword, config.bcryptRounds);
      await user.save();

      // Refresh the session so the cookie remains valid for the new password.
      issueSession(res, user);

      return res.json({
        success: true,
        data: { message: 'Password updated successfully' },
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/profile/picture:
 *   post:
 *     summary: Upload a profile picture (JPEG/PNG/WebP, max 2MB)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture: { type: string, format: binary }
 *     responses:
 *       200: { description: Profile picture updated }
 *       400: { description: Invalid file }
 *       429: { description: Upload rate limit reached }
 */
router.post(
  '/profile/picture',
  protect,
  uploadLimiter,
  dailyUploadBudget,
  (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err) return next(err);
      return next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        const error = new Error('No file uploaded');
        error.statusCode = 400;
        return next(error);
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        return next(error);
      }

      user.profilePicture = req.file.path;
      user.profileComplete = Boolean(user.name && user.profilePicture);
      await user.save();

      return res.json({
        success: true,
        data: {
          message: 'Profile picture updated successfully',
          profilePicture: user.profilePicture,
          profileComplete: user.profileComplete,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current authenticated user from the database
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 *       404: { description: User not found }
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'name email role profilePicture profileComplete jobTitle bio'
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        profileComplete: user.profileComplete,
        jobTitle: user.jobTitle,
        bio: user.bio,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
