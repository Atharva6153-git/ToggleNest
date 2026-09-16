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
 *     description: Returns task activity logs sorted by timestamp descending. Optionally filtered to a single project's tasks. Requires authentication.
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *         description: Project ID — only logs for this project's tasks are returned
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
