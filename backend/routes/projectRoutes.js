const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const projectController = require('../controllers/projectController');

/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Project management endpoints (all require authentication)
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     description: Admin role required. Requires authentication.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Website Redesign
 *               description:
 *                 type: string
 *                 example: Redesign the company website
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00.000Z"
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: User IDs of project members
 *                 example: ["64f1c2e9a1b2c3d4e5f6a7b8"]
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Not authenticated
 */
router.post('/', auth, roleMiddleware('admin'), projectController.createProject);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List projects with filtering and pagination
 *     description: Admins see all projects; other users see projects they created or are members of.
 *     tags: [Projects]
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
 *         description: Projects per page (max 100)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive search on project name
 *     responses:
 *       200:
 *         description: Paginated list of projects
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
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *       401:
 *         description: Not authenticated
 */
router.get('/', auth, projectController.getProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     description: Only accessible to the project creator or a member.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this project
 *       404:
 *         description: Project not found
 */
router.get('/:id', auth, projectController.getProjectById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: Only the creator or an admin can update. Notifies newly added members. Partial updates supported.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Website Redesign 2026
 *               description:
 *                 type: string
 *                 example: Updated description
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User IDs of project members
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this project
 *       404:
 *         description: Project not found
 */
router.put('/:id', auth, projectController.updateProject);

/**
 * @swagger
 * /projects/{id}:
 *   patch:
 *     summary: Update a project (partial)
 *     description: Alias of PUT /projects/{id}. Only the creator or an admin can update.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this project
 *       404:
 *         description: Project not found
 */
router.patch('/:id', auth, projectController.updateProject);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Admin role required. Requires authentication.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted
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
 *                       example: Project deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Project not found
 */
router.delete('/:id', auth, roleMiddleware('admin'), projectController.deleteProject);

module.exports = router;
