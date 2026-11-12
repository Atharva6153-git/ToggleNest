# Security Policy

Togglenest is a MERN application (React + Vite frontend, Express + MongoDB
backend). This document describes the controls that are implemented in the
codebase and the production settings required for them to be effective.

## Reporting a Vulnerability

Please **do not** open a public issue for a security problem.

- Email the maintainer with a description, reproduction steps, and impact.
- Include the affected route/component and any relevant request or response
  samples with secrets removed.
- You can expect an initial acknowledgement within 3 business days. Valid
  reports are fixed as quickly as possible and credited if you wish.

## Security checklist

| # | Control | Implementation |
| - | ------- | -------------- |
| 1 | Hide API keys | All credentials are read from environment variables. Firebase web config uses `VITE_FIREBASE_*`; the backend reads `JWT_SECRET`, `MONGO_URI`, `CLOUDINARY_*`, and Firebase Admin credentials from env. No credential is hardcoded in frontend or backend source. |
| 2 | Check environment variables | `backend/config/env.js` validates configuration at boot. Production fails fast when `MONGO_URI`, `JWT_SECRET` (32+ chars), `FRONTEND_URL`, or `COOKIE_SECURE` are missing/invalid. Required variables are documented in `backend/.env.example` and `frontend/.env.example`. |
| 3 | Check keys in git | Root, `backend/`, and `frontend/` `.gitignore` files exclude `.env*` (except examples), service-account JSON, private keys, and certificates. `npm run security:secrets` in `backend/` scans the source tree for high-confidence credential patterns. `.github/workflows/security.yml` runs it on every push/PR. |
| 4 | Protect admin routes | Admin-only routes use `protect` + `roleMiddleware('admin')`. The role is re-read from MongoDB on every request, so a stale/demoted JWT cannot keep admin access. The frontend `AdminRoute` guard is defence-in-depth only. |
| 5 | Add authentication | JWT sessions are issued on login/Firebase login and stored in an `httpOnly`, `Secure` (production), `SameSite` session cookie. Bearer tokens remain supported for non-browser API clients. Protected routes use `authMiddleware`, which validates signature, algorithm (`HS256`), issuer, and audience. |
| 6 | Check user permissions | Object-level authorization lives in `backend/utils/accessControl.js` and is applied to tasks, projects, comments, dashboard, and activity logs. Members can only read/write records they own or that belong to projects they are members of; admins may manage all records. Registration always assigns `member`; roles cannot be self-assigned. |
| 7 | Sanitize user inputs | Every request body/query/params is sanitized by `middleware/sanitizeInput.js` (strips HTML tags, script/style content, inline event handlers, and active URL schemes). Passwords and Firebase ID tokens are excluded. `express-validator` enforces types, lengths, and formats on auth, task, project, comment, notification, and dashboard inputs. Request bodies are limited to 100 KB (JSON) / 20 KB (urlencoded). |
| 8 | Protect against XSS | React escapes rendered values by default; there is no `dangerouslySetInnerHTML`, `innerHTML`, or `eval` usage. User content is sanitized server-side before storage. The frontend `vercel.json` sends a restrictive Content-Security-Policy and `X-Content-Type-Options: nosniff`. Helmet sets API security headers in production. |
| 9 | SQL injection protection | The application uses MongoDB, not SQL, so SQL injection does not apply. NoSQL injection is addressed by Mongoose schema casting, `mongoose.set('sanitizeFilter', true)`, a recursive `$`/`.` key sanitizer in `server.js`, and `hpp`. Query values are passed as typed values/`$eq` rather than raw objects, and user-supplied search text is regex-escaped. |
| 10 | Check database rules | Mongoose models define required fields, enums, min/max lengths, email format, numeric bounds, and indexes. The database is never exposed to the browser; all access goes through authenticated API routes. Passwords are hashed with bcrypt (`BCRYPT_ROUNDS`, default 12) and excluded from queries/responses by default (`select: false`, `toJSON` strips it). |
| 11 | Add rate limiting | `express-rate-limit` provides a global IP limit, a stricter auth limit (failed attempts only), and an upload limit. Limits are configurable with `GLOBAL_RATE_LIMIT`, `AUTH_RATE_LIMIT`, and `UPLOAD_RATE_LIMIT`. |
| 12 | Set a spend cap | Application-side: uploads are limited per hour and per user per day (`UPLOAD_DAILY_LIMIT`, default 20), and auth/global limits cap abusive traffic. Provider-side caps must also be configured (see below). |
| 13 | Secure file uploads | Multer + Cloudinary accept one file per request, max 2 MB, with an allow-list of JPEG/PNG/WebP MIME types and matching extensions. Files are stored with `resource_type: image` and returned as secure HTTPS URLs. Cloudinary credentials are never logged. |
| 14 | CSRF protection | Double-submit cookie pattern: a random `tn_csrf` cookie is issued, and every unsafe request must echo it in `X-CSRF-Token` (timing-safe comparison). Authentication endpoints are exempt because no session exists yet; they remain protected by rate limits, CORS, and validation. Bearer-authenticated API clients are exempt because browsers cannot set that header cross-site. |
| 15 | Check CORS settings | CORS is allow-list only. `FRONTEND_URL` (comma-separated) defines production origins; only localhost dev origins are added outside production. Credentials are enabled, allowed headers are explicit, and unknown origins receive a 403. |
| 16 | Enable HTTPS | Production forces HTTPS with a 308 redirect (`enforceHttps`) behind a trusted proxy (`TRUST_PROXY=true`), HSTS (`max-age=15552000; includeSubDomains; preload`), and `upgrade-insecure-requests` in the frontend CSP. `COOKIE_SECURE=true` is mandatory in production. |
| 17 | Add security headers | Helmet + custom middleware set CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and `Cross-Origin-Resource-Policy`. `frontend/vercel.json` sets equivalent headers for static assets. |
| 18 | Secure cookies | Session cookies are `httpOnly`, `Secure` in production, `SameSite` configurable (`none` for cross-site prod by default, `lax` in dev), scoped to `/`, and expire after 24 hours. Logout clears the cookie. The CSRF cookie is intentionally readable but carries no session authority. |
| 19 | Disable debug mode | `x-powered-by` is disabled; Morgan request logging is development-only; error responses hide stack traces and internal messages in production; Swagger is disabled in production unless `ENABLE_SWAGGER=true`, and then requires an authenticated admin. No credential or token values are logged. |
| 20 | Check production settings | Production startup validates env vars, enables HTTPS/secure cookies/HSTS, tightens CORS and CSP, hides errors, disables debug docs, uses graceful shutdown, and enables `trust proxy` via `TRUST_PROXY`. See the deployment checklist below. |

## Session and CSRF flow

1. `POST /api/auth/login` (or `/register` + `/login`, `/auth/firebase-login`)
   sets `tn_session` (httpOnly) and rotates `tn_csrf`.
2. The frontend calls `GET /api/auth/csrf` when it has no readable CSRF cookie.
3. Unsafe requests send the CSRF cookie value in `X-CSRF-Token`.
4. `GET /api/auth/me` rehydrates the signed-in user from the cookie on load.
5. `POST /api/auth/logout` clears the session cookie.

The browser never stores a session token in `localStorage` or `sessionStorage`.
Only non-sensitive profile fields are cached for instant UI rendering.

## Required production environment

### Backend

| Variable | Requirement |
| -------- | ----------- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas/self-hosted connection string with a least-privilege database user |
| `JWT_SECRET` | 32+ random characters, unique per environment |
| `FRONTEND_URL` | Exact HTTPS frontend origin(s), comma-separated |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `none` when frontend/API are on different sites, otherwise `lax` |
| `TRUST_PROXY` | `true` behind a load balancer/reverse proxy |
| `CLOUDINARY_*` | Cloud name, API key, API secret |
| `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase Admin credentials |
| `RETURN_TOKEN_IN_BODY` | Leave `false` for browsers |
| `ENABLE_SWAGGER` | Leave `false` unless docs are needed for admins |

### Frontend (Vercel/host)

Set `VITE_API_URL` and `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
`VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` in the hosting
provider. `frontend/.env.example` documents the names.

## Provider spend caps

The application throttles uploads and auth attempts, but billing limits must
also be set in the provider consoles:

- **Cloudinary**: set account/product environment usage limits and billing
  alerts; keep the unsigned-upload preset disabled (the backend signs uploads).
- **MongoDB Atlas**: choose a fixed cluster tier (not serverless autoscaling
  without a cap) and configure project billing alerts.
- **Firebase**: set budget alerts/quotas in Google Cloud Billing and restrict
  the API key to the required Firebase APIs and authorized domains.
- **Hosting (Render/Railway/Fly/Vercel)**: set spend limits or a hard instance
  cap and enable usage alerts.
- **Email/SMS/push providers**: configure sending quotas and daily caps.

## Secret scanning

```bash
cd backend
npm run security:secrets
```

The scan exits non-zero when it finds Google/Firebase keys, private keys, AWS
keys, GitHub/Slack/Stripe tokens, credential-bearing Mongo/Cloudinary URLs,
JWT-shaped tokens, or credential-like assignments in source files. Local `.env`
files and service-account JSON files are ignored because they are gitignored.

If a real secret is ever committed:

1. Revoke/rotate it with the provider immediately.
2. Remove it from the working tree and rewrite git history before sharing.
3. Re-run the scanner and the CI workflow.

## Verifying the checklist locally

```bash
# Backend: tests + secret scan
cd backend
npm test
npm run security:secrets

# Frontend: production build + lint
cd frontend
npm run build
npm run lint
```
