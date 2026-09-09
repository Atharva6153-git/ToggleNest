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

router.use(authMiddleware);

router.post('/', validateTaskPayload, handleValidationErrors, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', validateTaskPayload, handleValidationErrors, taskController.updateTask);
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
router.delete('/:id', roleMiddleware('admin'), taskController.deleteTask);

module.exports = router;
