const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Activity Logs
 *     description: Task activity log endpoints (all require authentication)
 */

router.use(authMiddleware);

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: List all activity logs
 *     description: Returns all task activity logs sorted by timestamp descending. Requires authentication.
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of activity logs
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
 *                     $ref: '#/components/schemas/ActivityLog'
 *       401:
 *         description: Not authenticated
 */
router.get('/', activityLogController.getActivityLogs);

module.exports = router;
