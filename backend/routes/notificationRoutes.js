const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Notification endpoints (all require authentication)
 */

router.use(authMiddleware);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List the current user's notifications
 *     description: Returns paginated notifications plus the unread count. Requires authentication.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Notifications per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of notifications
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
 *                     $ref: '#/components/schemas/Notification'
 *                 unreadCount:
 *                   type: integer
 *                   example: 3
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all of the current user's notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of modified notifications
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
 *                     modifiedCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Not authenticated
 */
router.patch('/read-all', markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Updated notification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
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
 *                       example: Notification deleted
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', deleteNotification);

module.exports = router;
