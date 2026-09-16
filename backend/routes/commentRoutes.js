const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getComments,
  createComment,
  deleteComment,
} = require('../controllers/commentController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Comments
 *     description: Project comment (Project Discussion) endpoints (all require authentication)
 */

router.use(authMiddleware);

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: List all comments for a project
 *     description: Returns all comments for the given project, populated with the author's name, sorted oldest first. Requires authentication.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         required: true
 *         schema: { type: string }
 *         description: Project ID to fetch comments for
 *     responses:
 *       200:
 *         description: List of comments
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
 *                     $ref: '#/components/schemas/Comment'
 *                 count:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Valid project id is required
 *       401:
 *         description: Not authenticated
 */
router.get('/', getComments);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Post a new comment on a project
 *     description: Creates a comment on the given project with the authenticated user as author. Requires authentication.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, text]
 *             properties:
 *               project:
 *                 type: string
 *                 description: Project ID the comment belongs to
 *                 example: 64f1c2e9a1b2c3d4e5f6a7ca
 *               text:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Great progress on the board!
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid payload — missing project id or text, or text over 1000 characters
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Project not found
 */
router.post('/', createComment);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Only the comment's author or an admin can delete it. Requires authentication.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
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
 *                       example: Comment deleted
 *       400:
 *         description: Invalid comment id
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: You can only delete your own comments
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', deleteComment);

module.exports = router;