const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getAuth, getApps } = require("../config/firebaseAdmin");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const upload = require("../config/cloudinary");

const router = express.Router();
console.log("AUTH ROUTES FILE LOADED");

const getNormalizedEmail = (value) => (
  typeof value === "string" ? value.trim().toLowerCase() : ""
);

router.get("/test", (req, res) => {
  res.send("Auth route is working!");
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 description: Ignored — new users are always created as "member". Admin roles cannot be self-assigned at registration.
 *                 example: member
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: User registered successfully
 *       400:
 *         description: User already exists or invalid payload
 */
// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const email = getNormalizedEmail(req.body?.email);

    if (!email) {
      const error = new Error("Invalid email");
      error.statusCode = 400;
      return next(error);
    }

    const existingUser = await User.findOne({ email: { $eq: email } });

    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "member",
    });

    await user.save();

    return res.status(201).json({
      success: true,
      data: { message: "User registered successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid email or password
 */
// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = getNormalizedEmail(req.body?.email);

    if (!email) {
      const error = new Error("Invalid email or password");
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findOne({ email: { $eq: email } });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 400;
      return next(error);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 400;
      return next(error);
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      success: true,
      data: {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileComplete: user.profileComplete,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/firebase-login:
 *   post:
 *     summary: Verify a Firebase ID token and issue an app JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token from signInWithPopup (Google/GitHub)
 *     responses:
 *       200:
 *         description: Login successful, returns an app JWT
 *       400:
 *         description: Missing idToken
 *       401:
 *         description: Invalid or expired Firebase ID token
 */
// FIREBASE LOGIN (Google / GitHub via Firebase)
router.post("/firebase-login", async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      const error = new Error("Missing idToken in request body");
      error.statusCode = 400;
      return next(error);
    }

    if (!getApps().length) {
      const error = new Error(
        "Firebase login is not configured on the server. The service account file is missing."
      );
      error.statusCode = 500;
      return next(error);
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);

    const email = (decodedToken.email || "").toLowerCase();
    const name = decodedToken.name || email.split("@")[0];

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new User({
        name,
        email,
        password: hashedPassword,
        role: "member",
      });

      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      success: true,
      data: {
        message: "Firebase login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileComplete: user.profileComplete,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: List all users (for assignee pickers)
 *     description: Requires authentication.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
// LIST USERS (for assignee pickers)
router.get("/users", protect, async (req, res, next) => {
  try {
    const users = await User.find().select("name email role").sort({ name: 1 });
    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the current authenticated user profile
 *     description: Requires authentication.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile of the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: You accessed a protected route!
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
// PROTECTED PROFILE ROUTE
router.get("/profile", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email role profilePicture profileComplete jobTitle bio createdAt"
    );

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.json({
      success: true,
      data: {
        message: "You accessed a protected route!",
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// UPDATE PROFILE
router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, jobTitle, bio, password, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    if (name) {
      if (typeof name !== "string" || !name.trim()) {
        const error = new Error("Name cannot be empty");
        error.statusCode = 400;
        return next(error);
      }
      user.name = name.trim();
    }

    if (typeof jobTitle === "string") {
      if (jobTitle.length > 100) {
        const error = new Error("Job title cannot exceed 100 characters");
        error.statusCode = 400;
        return next(error);
      }
      user.jobTitle = jobTitle.trim();
    }

    if (typeof bio === "string") {
      if (bio.length > 250) {
        const error = new Error("Bio cannot exceed 250 characters");
        error.statusCode = 400;
        return next(error);
      }
      user.bio = bio.trim();
    }

    if (password || newPassword) {
      const newPw = newPassword || password;
      if (typeof newPw !== "string" || newPw.length < 6) {
        const error = new Error("Password must be at least 6 characters");
        error.statusCode = 400;
        return next(error);
      }
      if (password && newPassword) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          const error = new Error("Current password is incorrect");
          error.statusCode = 400;
          return next(error);
        }
      }
      user.password = await bcrypt.hash(newPw, 10);
    }

    user.profileComplete = Boolean(user.name && user.profilePicture);
    await user.save();

    return res.json({
      success: true,
      data: {
        message: "Profile updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          profileComplete: user.profileComplete,
          jobTitle: user.jobTitle,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change the current user's password
 *     description: >-
 *       Verifies the current password, checks that the new password and its
 *       confirmation match, then hashes and saves the new password.
 *       Requires authentication.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmNewPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPass123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPass456
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPass456
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Password updated successfully
 *       400:
 *         description: Current password is incorrect, new password too short, or passwords do not match
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authenticated
 */
// CHANGE PASSWORD
router.put("/change-password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (typeof currentPassword !== "string" || !currentPassword) {
      const error = new Error("Current password is required");
      error.statusCode = 400;
      return next(error);
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      const error = new Error("New password must be at least 6 characters");
      error.statusCode = 400;
      return next(error);
    }

    if (newPassword !== confirmNewPassword) {
      const error = new Error("New password and confirmation do not match");
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 400;
      return next(error);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      data: {
        message: "Password updated successfully",
      },
    });
  } catch (error) {
    return next(error);
  }
});

// UPLOAD PROFILE PICTURE
router.post(
  "/profile/picture",
  protect,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, (err) => {
      if (err) {
        console.error("[profile/picture][multer] error:", {
          code: err.code,
          message: err.message,
          field: err.field,
          stack: err.stack,
        });
        return next(err);
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      console.log("[profile/picture] request inspection:", {
        contentType: req.headers["content-type"],
        body: req.body,
        file: req.file
          ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size }
          : null,
      });

      if (!req.file) {
        const error = new Error("No file uploaded");
        error.statusCode = 400;
        return next(error);
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
      }

      user.profilePicture = req.file.path;
      user.profileComplete = Boolean(user.name && user.profilePicture);
      await user.save();

      return res.json({
        success: true,
        data: {
          message: "Profile picture updated successfully",
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
 *     summary: Get the current authenticated user from the database (fresh role lookup)
 *     description: >-
 *       Returns the CURRENT user record from MongoDB (name, email, role).
 *       The role comes from a fresh database lookup every time — NOT from the JWT
 *       payload — so frontends can rely on this as the source of truth for roles.
 *       Requires authentication.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user fetched from the database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, member]
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
// CURRENT USER (fresh DB lookup — source of truth for the role)
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('name email role profilePicture profileComplete jobTitle bio');

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
