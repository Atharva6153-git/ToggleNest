const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ToggleNest API',
      version: '1.0.0',
      description:
        'API documentation for the ToggleNest project management backend. ' +
        'Use the Authorize button to paste a JWT token obtained from the login endpoint ' +
        'and it will be applied to all protected routes.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Paste your JWT token here. Get one by calling /auth/login.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b8' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'member'], example: 'member' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b9' },
            title: { type: 'string', example: 'Design landing page' },
            description: { type: 'string', example: 'Create the landing page mockups' },
            status: { type: 'string', enum: ['To-Do', 'In Progress', 'Done'], example: 'To-Do' },
            priority: { type: 'string', enum: ['Low', 'Medium', 'High'], example: 'Medium' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-12-31T00:00:00.000Z' },
            assignedTo: { $ref: '#/components/schemas/User' },
            project: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7ca' },
            createdBy: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b8' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7ca' },
            name: { type: 'string', example: 'Website Redesign' },
            description: { type: 'string', example: 'Redesign the company website' },
            deadline: { type: 'string', format: 'date-time', example: '2026-12-31T00:00:00.000Z' },
            members: {
              type: 'array',
              items: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b8' },
            },
            createdBy: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b8' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7db' },
            recipient: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b8' },
            message: { type: 'string', example: 'You were assigned to task: Design landing page' },
            type: {
              type: 'string',
              enum: ['task_assigned', 'status_changed', 'task_due_soon', 'project_assigned'],
              example: 'task_assigned',
            },
            relatedTask: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string' },
              },
            },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ActivityLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7ec' },
            task: { type: 'string', example: '64f1c2e9a1b2c3d4e5f6a7b9' },
            action: { type: 'string', example: 'Status changed to Done' },
            performedBy: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Login successful' },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                totalTasks: { type: 'integer', example: 12 },
                tasksByStatus: {
                  type: 'object',
                  properties: {
                    'To-Do': { type: 'integer', example: 4 },
                    'In Progress': { type: 'integer', example: 5 },
                    Done: { type: 'integer', example: 3 },
                  },
                },
                tasksByPriority: {
                  type: 'object',
                  properties: {
                    Low: { type: 'integer', example: 3 },
                    Medium: { type: 'integer', example: 6 },
                    High: { type: 'integer', example: 3 },
                  },
                },
                completionPercentage: { type: 'number', example: 25 },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;