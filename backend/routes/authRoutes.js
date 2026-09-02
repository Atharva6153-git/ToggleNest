const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
console.log("AUTH ROUTES FILE LOADED");

router.get("/test", (req, res) => {
  res.send("Auth route is working!");
});

// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

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
      role: role || "member",
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

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

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
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

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

// PROTECTED PROFILE ROUTE
router.get("/profile", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

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

module.exports = router;
