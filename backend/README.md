# ToggleNest Backend

ToggleNest is a MERN stack project management application for creating projects, assigning tasks, tracking status, logging task activity, and viewing project summaries. This backend provides the REST API used by the frontend.

## Project Overview

This backend handles:
- User registration and login with JWT-based auth
- Project CRUD operations
- Task CRUD and task status updates
- Population of assigned user details for tasks
- Activity log tracking for task actions
- Dashboard summary stats for total tasks, status counts, and priority counts
- Validation, error handling, rate limiting, request logging, and security headers

## Tech Stack

- MongoDB - database
- Express.js - API framework
- React - frontend client
- Node.js - runtime
- Mongoose - MongoDB object modeling
- JWT - authentication
- express-validator - request validation
- express-rate-limit - API rate limiting
- Helmet - security headers
- Morgan - request logging

## Environment Variables

Create a `.env` file in the `backend` directory with the following values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/togglenest
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

Required variables:
- `PORT` - port for the backend server
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - secret used to sign JWT tokens
- `NODE_ENV` - optional, typically `development` or `production`

## Local Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Start the backend in development mode
```bash
cd backend
npm run dev
```

### 3. Or run the server normally
```bash
cd backend
npm start
```

The server will start on:
```text
http://localhost:5000
```

## API Endpoints

Base URL:
```text
http://localhost:5000/api
```

---

### Auth Routes

#### 1) Register user
- Method: `POST`
- Endpoint: `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "member"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "message": "User registered successfully"
  }
}
```

#### 2) Login user
- Method: `POST`
- Endpoint: `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64e9d2c1a6e9e1b12d3c4a5b",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

#### 3) Get profile
- Method: `GET`
- Endpoint: `/auth/profile`
- Requires JWT in header:
```http
Authorization: Bearer <token>
```

Example response:
```json
{
  "success": true,
  "data": {
    "message": "You accessed a protected route!",
    "user": {
      "_id": "64e9d2c1a6e9e1b12d3c4a5b",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

---

### Project Routes

#### 1) Create project
- Method: `POST`
- Endpoint: `/projects`

Request:
```json
{
  "name": "Website Redesign",
  "description": "Refresh the public marketing website",
  "deadline": "2026-09-15T00:00:00.000Z",
  "members": ["64e9d2c1a6e9e1b12d3c4a5b"],
  "createdBy": "64e9d2c1a6e9e1b12d3c4a5b"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f2a4d15b7d2f01d3de8f22",
    "name": "Website Redesign",
    "description": "Refresh the public marketing website",
    "deadline": "2026-09-15T00:00:00.000Z"
  }
}
```

#### 2) Get all projects
- Method: `GET`
- Endpoint: `/projects`

Example response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f2a4d15b7d2f01d3de8f22",
      "name": "Website Redesign",
      "description": "Refresh the public marketing website"
    }
  ]
}
```

#### 3) Get project by ID
- Method: `GET`
- Endpoint: `/projects/:id`

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f2a4d15b7d2f01d3de8f22",
    "name": "Website Redesign",
    "description": "Refresh the public marketing website"
  }
}
```

#### 4) Update project
- Method: `PUT`
- Endpoint: `/projects/:id`

Request:
```json
{
  "name": "Website Redesign 2026",
  "description": "Updated marketing website refresh"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f2a4d15b7d2f01d3de8f22",
    "name": "Website Redesign 2026",
    "description": "Updated marketing website refresh"
  }
}
```

#### 5) Delete project
- Method: `DELETE`
- Endpoint: `/projects/:id`

Example response:
```json
{
  "success": true,
  "data": {
    "message": "Project deleted"
  }
}
```

---

### Task Routes

#### 1) Create task
- Method: `POST`
- Endpoint: `/tasks`

Request:
```json
{
  "title": "Build login screen",
  "description": "Create a clean login page for the dashboard",
  "status": "To-Do",
  "priority": "High",
  "dueDate": "2026-09-10T00:00:00.000Z",
  "project": "64f2a4d15b7d2f01d3de8f22",
  "assignedTo": "64e9d2c1a6e9e1b12d3c4a5b",
  "createdBy": "64e9d2c1a6e9e1b12d3c4a5b"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f8d1c3a0b9c2d7ef111111",
    "title": "Build login screen",
    "description": "Create a clean login page for the dashboard",
    "status": "To-Do",
    "priority": "High",
    "dueDate": "2026-09-10T00:00:00.000Z",
    "assignedTo": {
      "_id": "64e9d2c1a6e9e1b12d3c4a5b",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### 2) Get tasks (paginated)
- Method: `GET`
- Endpoint: `/tasks?page=1&limit=10`
- Optional query: `project=<project_id>`

Example response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8d1c3a0b9c2d7ef111111",
      "title": "Build login screen",
      "status": "To-Do",
      "priority": "High",
      "assignedTo": {
        "_id": "64e9d2c1a6e9e1b12d3c4a5b",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### 3) Get task by ID
- Method: `GET`
- Endpoint: `/tasks/:id`

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f8d1c3a0b9c2d7ef111111",
    "title": "Build login screen",
    "status": "In Progress",
    "priority": "High",
    "assignedTo": {
      "_id": "64e9d2c1a6e9e1b12d3c4a5b",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### 4) Update task
- Method: `PUT`
- Endpoint: `/tasks/:id`

Request:
```json
{
  "title": "Build login screen v2",
  "description": "Revised product login page",
  "status": "In Progress",
  "priority": "Medium"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f8d1c3a0b9c2d7ef111111",
    "title": "Build login screen v2",
    "description": "Revised product login page",
    "status": "In Progress",
    "priority": "Medium"
  }
}
```

#### 5) Delete task
- Method: `DELETE`
- Endpoint: `/tasks/:id`

Example response:
```json
{
  "success": true,
  "data": {
    "message": "Task deleted"
  }
}
```

#### 6) Update task status
- Method: `PATCH`
- Endpoint: `/tasks/:id/status`

Request:
```json
{
  "status": "Done"
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "64f8d1c3a0b9c2d7ef111111",
    "title": "Build login screen",
    "status": "Done"
  }
}
```

---

### Activity Log Routes

#### 1) Get all activity logs
- Method: `GET`
- Endpoint: `/activity-logs`

Example response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f9d4aa2bc1f42189ef90dd",
      "task": "64f8d1c3a0b9c2d7ef111111",
      "action": "Status changed to Done",
      "performedBy": {
        "_id": "64e9d2c1a6e9e1b12d3c4a5b",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "timestamp": "2026-08-29T12:00:00.000Z"
    }
  ]
}
```

---

### Dashboard Routes

#### 1) Get dashboard summary
- Method: `GET`
- Endpoint: `/dashboard/summary?project=<project_id>`

Example response:
```json
{
  "success": true,
  "data": {
    "totalTasks": 12,
    "tasksByStatus": {
      "To-Do": 4,
      "In Progress": 5,
      "Done": 3
    },
    "tasksByPriority": {
      "Low": 3,
      "Medium": 5,
      "High": 4
    }
  }
}
```

---

## Validation & Error Handling

The API validates request payloads and returns consistent error responses.

Example validation error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "title is required and cannot be empty"
    }
  ]
}
```

Example not found error:
```json
{
  "success": false,
  "message": "Task not found"
}
```

## Notes

- Protected routes require a valid JWT token in the `Authorization` header.
- `GET /api/tasks` supports pagination with `page` and `limit` query params.
- The app uses a global rate limit (100 requests per 15 minutes per IP).
- Request logging is enabled in development mode and security headers are added globally.

## Development Commands

```bash
cd backend
npm install
npm run dev
```

To run the server without nodemon:
```bash
cd backend
npm start
```


