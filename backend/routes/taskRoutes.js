const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const validateTaskPayload = [
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('title is required and cannot be empty'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['To-Do', 'In Progress', 'Done'])
    .withMessage('status must be one of "To-Do", "In Progress", "Done"'),
  body('priority')
    .optional({ values: 'falsy' })
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('priority must be one of "Low", "Medium", "High"'),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('dueDate must be a valid date'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  return next();
};

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: Task management endpoints (all require authentication)
 */

router.use(authMiddleware);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     description: Assigns the task to the authenticated user as creator and creates a notification for the assignee if applicable. Requires authentication.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design landing page
 *               description:
 *                 type: string
 *                 example: Create the landing page mockups
 *               status:
 *                 type: string
 *                 enum: [To-Do, In Progress, Done]
 *                 example: To-Do
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 example: Medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T00:00:00.000Z"
 *               assignedTo:
 *                 type: string
 *                 description: User ID of the assignee
 *                 example: 64f1c2e9a1b2c3d4e5f6a7b8
 *               project:
 *                 type: string
 *                 description: Project ID the task belongs to
 *                 example: 64f1c2e9a1b2c3d4e5f6a7ca
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Not authenticated
 */
router.post('/', validateTaskPayload, handleValidationErrors, taskController.createTask);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks with filtering and pagination
 *     description: Supports filtering by project, priority, status, assignee, and title search. Requires authentication.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *         description: Filter by project ID
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [Low, Medium, High] }
 *         description: Filter by priority
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [To-Do, In Progress, Done] }
 *         description: Filter by status
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *         description: Filter by assignee user ID
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive search on task title
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Tasks per page
 *     responses:
 *       200:
 *         description: Paginated list of tasks
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 */
router.get('/', taskController.getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.get('/:id', taskController.getTaskById);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Partial updates are supported — only provided fields are changed. Requires authentication.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design landing page v2
 *               description:
 *                 type: string
 *                 example: Updated description
 *               status:
 *                 type: string
 *                 enum: [To-Do, In Progress, Done]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               assignedTo:
 *                 type: string
 *                 description: User ID of the assignee
 *               project:
 *                 type: string
 *                 description: Project ID
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.put('/:id', validateTaskPayload, handleValidationErrors, taskController.updateTask);

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     summary: Update only the status of a task
 *     description: Also writes an activity log entry and notifies the assignee (if changed by someone else). Requires authentication.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [To-Do, In Progress, Done]
 *                 example: Done
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Status must be one of "To-Do", "In Progress", "Done"
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 */
router.patch(
  '/:id/status',
  [
    body('status')
      .exists()
      .withMessage('status is required')
      .isIn(['To-Do', 'In Progress', 'Done'])
      .withMessage('status must be one of "To-Do", "In Progress", "Done"'),
  ],
  handleValidationErrors,
  taskController.updateTaskStatus
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Admin role required. Requires authentication.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted
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
 *                       example: Task deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Task not found
 */
router.delete('/:id', roleMiddleware('admin'), taskController.deleteTask);

module.exports = router;
