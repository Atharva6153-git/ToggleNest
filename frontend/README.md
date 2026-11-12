# ToggleNest Frontend

React + Vite client for ToggleNest. It provides the dashboard, project boards, Kanban drag-and-drop, discussion feed, activity log, notifications, and profile onboarding for the ToggleNest MERN API.

## Requirements

- Node.js 18+
- The backend running locally (default `http://localhost:5000`) or a deployed API URL

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Backend API base URL. "http://localhost:5000/api" is the local default.
VITE_API_URL=http://localhost:5000/api

# Firebase Web SDK configuration (Project settings > General > Your apps).
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Notes:

- `VITE_*` values are public and inlined into the bundle at build time. They are safe to ship to browsers, but keep them in env files so deployments can point at different Firebase projects.
- Never commit `.env`; it is ignored by `frontend/.gitignore`. `.env.example` contains placeholders only.
- `VITE_API_URL` may omit the `/api` suffix — the axios client appends it automatically.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The backend must allow that origin (it does by default outside production).

## Authentication and CSRF

- The frontend authenticates with the backend's httpOnly `tn_session` cookie; no token is stored in `localStorage`.
- Axios is configured with `withCredentials: true`.
- Unsafe requests (`POST`, `PUT`, `PATCH`, `DELETE`) echo the readable `tn_csrf` cookie in the `X-CSRF-Token` header automatically (see `src/api/axiosInstance.js`).
- Auth state is hydrated from `GET /api/auth/me` / `GET /api/auth/profile`; protected routes use `RequireAuth` and admin-only routes use `AdminRoute` (client-side defence-in-depth only — the API enforces roles).

## Scripts

```bash
npm run dev       # start the Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # ESLint
```

## Production Deployment

- Build with the production `VITE_API_URL` and all `VITE_FIREBASE_*` values set; Vite inlines them at build time.
- Add the deployed frontend origin to the backend `FRONTEND_URL` allow-list and to Firebase Authentication > Settings > **Authorized domains** (plus the GitHub OAuth callback URL).
- `vercel.json` defines security headers (CSP, HSTS, nosniff, frame denial, referrer/permissions policy, COOP/CORP) for static hosting on Vercel. Adjust the CSP if you add new third-party script/style/connect origins.
- See the root [`README.md`](../README.md) and [`SECURITY.md`](../SECURITY.md) for the full deployment/security checklist.
