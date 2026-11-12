# ToggleNest

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)

## Project Overview

ToggleNest is a team task and workflow management platform built on the MERN stack (**M**ongoDB, **E**xpress, **R**eact, **N**ode.js). It centers all work around projects: admins create projects, assemble teams, and manage membership, while members focus on the boards they have been assigned to. Every project ships with a drag-and-drop Kanban board, a shared discussion feed, and a full activity trail, so the whole team can see what is happening and what comes next.

Access is role-based and enforced live from the database — changing a user's role takes effect immediately, with no re-login required. Before entering the app, every new user completes a mandatory profile onboarding step (name + profile photo), and sign-ups can happen via email/password or Google/GitHub single sign-on. The dashboard tracks completion progress and breaks tasks down by status and priority with charts, while the backend keeps everything secure with JWT authentication, bcrypt-hashed passwords, rate limiting, input sanitization, and centralized error handling.

## Live Demo

- Frontend: https://toggle-nest-gules.vercel.app/
- Backend API Docs: https://togglenest-h7jk.onrender.com/api-docs/

## ✅ Key Features

**Authentication**
- Email/password signup and login
- Google and GitHub OAuth single sign-on via Firebase
- Mandatory profile onboarding (name + photo) before accessing the app

**Role-Based Access Control**
- **Admin** — full access: project creation, editing, deletion, and team management
- **Member** — access limited to assigned projects and their task management
- Roles sync live from the database, no re-login required

**Project Management**
- Full CRUD with member assignment
- Project-scoped access — members only see the projects they're assigned to

**Kanban Board**
- Drag-and-drop task management across To-Do / In Progress / Done
- Boards strictly isolated per project

**Task Management**
- Priority levels, due dates, assignment, and status tracking

**Project Discussion**
- Per-project comment threads with a real-time-feel polling experience

**Activity Logging**
- Full audit trail of task and project changes

**Notifications**
- In-app notifications for task assignments and status changes

**Dashboard**
- Completion tracking with a circular progress indicator
- Status and priority breakdown charts (donut + bar)

**Security**
- httpOnly, SameSite session cookies with JWT validation (issuer + audience); Bearer tokens remain supported for non-browser API clients
- Double-submit CSRF protection on all unsafe requests
- bcrypt password hashing, password-strength rules, and no self-assigned admin roles
- Strict CORS allow-list, Helmet security headers, HTTPS enforcement in production
- Rate limiting per IP, daily per-user upload budget, and MIME/size-limited uploads
- NoSQL-injection protection (key sanitization + `sanitizeFilter`), hpp protection, and input validation/sanitization
- Object-level authorization and a live database role check on every protected request
- Centralized error handling that hides stack traces in production

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose (ODM) |
| Authentication | Firebase Authentication (Google / GitHub OAuth) + httpOnly cookie sessions |
| Image Uploads | Cloudinary |
| API Documentation | Swagger (swagger-jsdoc + swagger-ui-express), admin-only in production |
| Charts | Recharts |
| Security | bcrypt, Helmet, express-rate-limit, express-validator, hpp, CSRF double-submit, strict CORS |

## System Architecture

```mermaid
flowchart LR
    Client[React Client<br/>Vite · Tailwind · Framer Motion] <-->|REST + httpOnly session cookie| API[Express API<br/>Routes · Controllers · Models]
    API <-->|Mongoose ODM| DB[(MongoDB)]
    Firebase[Firebase Auth<br/>Google / GitHub OAuth] <--> API
    Cloudinary[Cloudinary<br/>Image Uploads] <--> API
```

## User Flow

```mermaid
flowchart TD
    A[Sign Up<br/>Email/password or OAuth] --> B[Mandatory Profile Completion<br/>Name + Photo]
    B --> C[Dashboard]
    C --> D{Admin role?}
    D -->|Yes| E[Create Project<br/>Build Team]
    D -->|No| F[View Assigned Projects]
    E --> G[Project Detail<br/>Kanban · Discussion · Team]
    F --> G
    G --> H[Manage Tasks<br/>Drag-and-Drop]
```

## 🔒 Role-Based Access

| Action | Admin | Member |
|---|---|---|
| Create project | ✅ | ❌ |
| Edit project | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Manage team (members) | ✅ | ❌ |
| View all projects | ✅ | ❌ |
| View assigned projects | ✅ | ✅ |
| Create / edit / delete tasks | ✅ | ✅ |
| Assign tasks | ✅ | ✅ |
| Drag-and-drop on Kanban | ✅ | ✅ |
| Comment on discussion | ✅ | ✅ |
| Delete own comment | ✅ | ✅ |
| Delete any comment | ✅ | ❌ |
| View dashboard | ✅ | ✅ |

## 📁 Project Structure

```
togglenest/
├── backend/
│   ├── config/           # env, swagger, cloudinary, firebase setup
│   ├── controllers/      # auth, project, task, comment, activity, notification logic
│   ├── middleware/       # auth guard, validation, error handler
│   ├── models/           # MongoDB schemas (User, Project, Task, Comment, ...)
│   ├── routes/           # Express route definitions with Swagger annotations
│   ├── tests/            # integration tests
│   └── server.js         # backend entry point
└── frontend/
    ├── src/
    │   ├── api/          # axios API client modules
    │   ├── components/   # shared UI (Layout, modals, Kanban, charts, discussion)
    │   ├── context/      # auth and theme React contexts
    │   ├── pages/        # route-level screens (Dashboard, Projects, ProjectDetail, ...)
    │   ├── App.jsx       # route definitions
    │   ├── firebase.js   # Firebase client configuration
    │   └── main.jsx      # frontend entry point
    └── index.html
```

## Planned / In Progress

- **Microsoft OAuth** — planned, not yet implemented.
- **Fine-grained per-project permissions** — project-level member assignment is in place; more granular permissions inside a project are still being refined.

## Backend API

For backend setup and API documentation, see the backend README:

- [backend/README.md](backend/README.md)

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
- Passwords must be 8–128 characters. The `role` field is ignored at registration; new accounts are always created as `member` and promoted by an admin.
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
- On success the API sets the httpOnly `tn_session` cookie (the JWT) and a readable `tn_csrf` cookie. Browser clients authenticate with the session cookie; the `token` field is only returned in the body when `RETURN_TOKEN_IN_BODY=true` (development default, disabled in production).
- Example success response:
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "token": "jwt_token_here (only when RETURN_TOKEN_IN_BODY=true)",
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
- Auth: the `tn_session` httpOnly cookie (browsers) or `Authorization: Bearer <token>` (API clients)
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

#### Get a CSRF token
- Method: `GET`
- Endpoint: `/auth/csrf`
- Returns the double-submit token and ensures the readable `tn_csrf` cookie exists. Send it as `X-CSRF-Token` on every `POST`/`PUT`/`PATCH`/`DELETE` request when authenticating with cookies.
- Example success response:
```json
{
  "success": true,
  "data": {
    "csrfToken": "random_hex_token"
  }
}
```

#### Logout
- Method: `POST`
- Endpoint: `/auth/logout`
- Clears the `tn_session` cookie.
- Example success response:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
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

## 🚀 Local Setup Instructions

### 1. Install dependencies

Install dependencies for both backend and frontend:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Set backend environment variables

Copy `backend/.env.example` to `backend/.env`, then fill in your values. The minimum local setup is:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/togglenest
JWT_SECRET=your_jwt_secret_here_at_least_32_characters
# Comma-separated production origin(s) for CORS.
FRONTEND_URL=http://localhost:5173
# Firebase Admin SDK: use FIREBASE_SERVICE_ACCOUNT_JSON (hosted) or _PATH (local file)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
# Profile picture uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The full list of options (cookie/CSRF, rate limits, upload budget, Swagger, token-in-body) is documented in [`backend/.env.example`](backend/.env.example) and [`SECURITY.md`](SECURITY.md). `MONGO_URI` and `JWT_SECRET` are always required; a production boot fails fast if `JWT_SECRET` is shorter than 32 characters, `FRONTEND_URL` is missing, or `COOKIE_SECURE` is disabled.

> **Firebase service account:** `FIREBASE_SERVICE_ACCOUNT_PATH` points to the Firebase Admin SDK service account JSON used to verify Google/GitHub login tokens. This file is **gitignored** and must be added manually — never commit it. Download it from Firebase Console > Project settings > Service accounts > Generate new private key, then save it where your `.env` entry points (e.g. `backend/config/firebase-service-account.json`).

### 3. Set frontend environment variables

Copy `frontend/.env.example` to `frontend/.env` and fill in the Firebase Web SDK config:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These `VITE_*` values are inlined at build time. Never commit `frontend/.env`; it is already ignored by `frontend/.gitignore`.

### 4. Start MongoDB

Make sure MongoDB is running locally on your machine or use a MongoDB connection URI pointing to a remote cluster.

### 5. Run the backend

```bash
cd backend
npm run dev
```

For production-style runs:

```bash
cd backend
npm start
```

The backend should run at `http://localhost:5000`.

### 6. Run the frontend

```bash
cd frontend
npm run dev
```

The frontend should run at `http://localhost:5173`.

## 🚀 Deployment Checklist

Before going live, remember to:

- **Frontend:** set `VITE_API_URL` to your production API URL before building, e.g. `VITE_API_URL=https://api.example.com` or `VITE_API_URL=https://api.example.com/api`. The frontend auto-appends `/api` if it isn't already present (see `frontend/src/api/axiosInstance.js`). Vite inlines env vars at build time, so the production bundle must be built with the correct value. Also set the six `VITE_FIREBASE_*` values. See `frontend/.env.example`.
- **Backend:** set `NODE_ENV=production`, `PORT`, `MONGO_URI`, a random `JWT_SECRET` of 32+ characters, and the production frontend URL(s) in `FRONTEND_URL` (comma-separated, used for CORS). Provide the Firebase service account via `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON string — preferred for hosted platforms where you can't upload a file) or `FIREBASE_SERVICE_ACCOUNT_PATH` (file path). Set `TRUST_PROXY=true` behind a reverse proxy and keep `COOKIE_SECURE=true`. See `backend/.env.example`.
- **HTTPS + cookies:** the API enforces HTTPS in production and issues `Secure`, `httpOnly` session cookies. If the frontend and API are on different sites, set `COOKIE_SAME_SITE=none` (which requires `COOKIE_SECURE=true`) and make sure both origins are listed in `FRONTEND_URL`.
- **Secrets:** never commit `.env` files, the Firebase service account JSON, private keys, or certificates. Run `cd backend && npm run security:secrets` before pushing; CI runs the same scan plus backend tests and a frontend production build (`.github/workflows/security.yml`).
- **Files in git:** this workspace currently has no git history, so the check is enforced by hardened `.gitignore` rules and the secret scanner. If you initialize a repository, run `git status --ignored` and confirm no credential files are tracked.
- **Spend caps:** code limits upload frequency/volume and authentication attempts. Also set provider-side billing/quota caps for Cloudinary, MongoDB Atlas, Firebase/Google Cloud, email/SMS, and hosting — see `SECURITY.md`.
- **Firebase Console:** add the production frontend URL under Authentication > Settings > **Authorized domains**, and add it as an **authorized redirect URI** for the Google and GitHub sign-in providers.
- **GitHub OAuth app:** add the production frontend URL as an **authorized callback / redirect URI** in the GitHub OAuth app settings (Settings > Developer settings > OAuth Apps), in addition to any localhost entries.
- **JWT secret:** use a long, random, unique value in production — never reuse a local development secret.
- **API docs:** Swagger is disabled in production by default. Only set `ENABLE_SWAGGER=true` if you need it, and note it is then restricted to authenticated admins.

## Notes

- Protected routes accept the httpOnly `tn_session` cookie (browsers) or `Authorization: Bearer <token>` (trusted API clients). Unsafe cookie-authenticated requests must echo `X-CSRF-Token`.
- Most route validations enforce task field rules such as required title and valid status/priority values.
- The API uses pagination for task lists, global/auth/upload rate limiting, and a daily per-user upload budget.
- Set `RETURN_TOKEN_IN_BODY=false` in production (the default) so browsers rely only on the httpOnly cookie.

## Contributors

- Atharva Jadhav

## License

This project is licensed under the MIT License - see the LICENSE file for details.
