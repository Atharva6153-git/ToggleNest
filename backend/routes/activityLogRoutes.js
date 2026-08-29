const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', activityLogController.getActivityLogs);

module.exports = router;
