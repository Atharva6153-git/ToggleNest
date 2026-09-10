const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard summary endpoints (all require authentication)
 */

router.use(authMiddleware);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary statistics
 *     description: Returns task totals grouped by status and priority, plus completion percentage. Optionally filtered by project.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *         description: Filter statistics to a single project ID
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         description: Not authenticated
 */
router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;
