const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// List all users (for assignee dropdowns, etc.)
router.get('/', auth, async (req, res, next) => {
  try {
    const users = await User.find().select('name email role').sort({ name: 1 });
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('getUsers error', err);
    return next(err);
  }
});

module.exports = router;