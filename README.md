# ToggleNest

<<<<<<< HEAD
ToggleNest is a task and project management application built with the MERN stack. It helps teams manage project work, track task status, assign team members, review activity history, and view dashboard summaries.

## Project Overview

The application includes:
- User authentication and protected routes
- Project creation and management
- Task creation, assignment, updates, and status tracking
- Activity logging for task events
- Dashboard summary metrics by status and priority
- Pagination and basic rate limiting/security middleware on the backend

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT
- Validation: express-validator
- Security: Helmet, express-rate-limit
- Logging: Morgan

## Backend API Endpoints

Base URL: `http://localhost:5000/api`

### Auth

#### Register user
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "member"
}
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "message": "User registered successfully"
  }
}
```

#### Login user
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

#### Get profile
- Method: `GET`
- Endpoint: `/auth/profile`
- Headers:
```http
Authorization: Bearer <token>
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "message": "You accessed a protected route!",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

### Projects

#### Create project
- Method: `POST`
- Endpoint: `/projects`
- Request body:
```json
{
  "name": "Website Redesign",
  "description": "Update the marketing website",
  "deadline": "2026-09-15T00:00:00.000Z",
  "createdBy": "user_id"
}
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "_id": "project_id",
    "name": "Website Redesign",
    "description": "Update the marketing website"
  }
}
```

#### Get all projects
- Method: `GET`
- Endpoint: `/projects`
- Example success response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "project_id",
      "name": "Website Redesign"
    }
  ]
}
```

### Tasks

#### Create task
- Method: `POST`
- Endpoint: `/tasks`
- Request body:
```json
{
  "title": "Build login screen",
  "description": "Create the dashboard login UI",
  "status": "To-Do",
  "priority": "High",
  "dueDate": "2026-09-10T00:00:00.000Z",
  "project": "project_id",
  "assignedTo": "user_id",
  "createdBy": "user_id"
}
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "title": "Build login screen",
    "status": "To-Do",
    "priority": "High",
    "assignedTo": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Get tasks with pagination
- Method: `GET`
- Endpoint: `/tasks?page=1&limit=10`
- Optional query: `project=<project_id>`
- Example success response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "task_id",
      "title": "Build login screen",
      "status": "To-Do",
      "priority": "High",
      "assignedTo": {
        "_id": "user_id",
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

#### Get task by ID
- Method: `GET`
- Endpoint: `/tasks/:id`
- Example success response:
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "title": "Build login screen",
    "status": "In Progress",
    "priority": "High"
  }
}
```

#### Update task
- Method: `PUT`
- Endpoint: `/tasks/:id`
- Request body:
```json
{
  "title": "Build login screen v2",
  "status": "In Progress",
  "priority": "High"
}
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "title": "Build login screen v2",
    "status": "In Progress"
  }
}
```

#### Update task status
- Method: `PATCH`
- Endpoint: `/tasks/:id/status`
- Request body:
```json
{
  "status": "Done"
}
```
- Example success response:
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "title": "Build login screen",
    "status": "Done"
  }
}
```

#### Delete task
- Method: `DELETE`
- Endpoint: `/tasks/:id`
- Example success response:
```json
{
  "success": true,
  "data": {
    "message": "Task deleted"
  }
}
```

### Activity Logs

#### Get all activity logs
- Method: `GET`
- Endpoint: `/activity-logs`
- Example success response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "log_id",
      "task": "task_id",
      "action": "Status changed to Done",
      "performedBy": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "timestamp": "2026-08-29T12:00:00.000Z"
    }
  ]
}
```

### Dashboard

#### Get dashboard summary
- Method: `GET`
- Endpoint: `/dashboard/summary?project=<project_id>`
- Example success response:
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

## Error Handling

The backend uses a centralized error middleware and returns consistent error payloads:

```json
{
  "success": false,
  "message": "Task not found"
}
```

Typical HTTP statuses:
- `400` for validation or bad input
- `401` for unauthorized access
- `404` for missing routes or resources
- `429` for rate limiting
- `500` for server errors

## Local Setup Instructions

### 1. Install dependencies
Open a terminal in the project root and run:

```bash
cd backend
npm install
```

### 2. Set environment variables
Create a `.env` file inside the `backend` folder with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/togglenest
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

### 3. Start MongoDB
Make sure MongoDB is running locally on your machine or use a MongoDB connection URI pointing to a remote cluster.

### 4. Run the backend
```bash
cd backend
npm start
```

For development with auto-restart:

```bash
cd backend
npm run dev
```

The backend should run at:

```text
http://localhost:5000
```

## Notes

- All protected routes require a valid JWT token in the `Authorization` header.
- Most route validations enforce task field rules such as required title and valid status/priority values.
- The API uses pagination for task lists and basic rate limiting for abuse protection.
=======
ToggleNest is a MERN stack project management application for tracking tasks, projects, and team activity. This repository contains the full-stack app with a React frontend and Express/MongoDB backend.

## Backend API

For backend setup and API documentation, see the backend README:

- [backend/README.md](backend/README.md)

## Tech Stack

- MongoDB
- Express.js
- React
- Node.js
>>>>>>> 35f2c9224451299b908b30e3c718dc5aa73e9fd9
