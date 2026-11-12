const crypto = require('crypto');
const { config } = require('../config/env');
const { setCsrfCookie, getCsrfCookie } = require('../utils/cookies');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Authentication endpoints cannot carry a session/CSRF pair before the user
// is signed in. They are still protected by the auth rate limiter, strict
// validation, and CORS.
const CSRF_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/firebase-login',
  '/api/auth/csrf',
]);

const normalizePath = (value) => {
  const path = String(value || '/').split('?')[0];
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Minimal cookie parser so the app does not need another dependency. */
const cookieParser = (req, res, next) => {
  const header = req.headers.cookie;
  req.cookies = {};

  if (header) {
    for (const pair of header.split(';')) {
      const separator = pair.indexOf('=');
      if (separator === -1) continue;
      const key = pair.slice(0, separator).trim();
      const rawValue = pair.slice(separator + 1).trim();
      if (!key) continue;
      try {
        req.cookies[key] = decodeURIComponent(rawValue);
      } catch {
        req.cookies[key] = rawValue;
      }
    }
  }

  next();
};

/**
 * Double-submit CSRF protection.
 *
 * - A random token is stored in a non-httpOnly cookie.
 * - Every unsafe request must echo that token in `X-CSRF-Token`.
 * - Requests authenticated with a Bearer header are exempt because a browser
 *   form cannot set an Authorization header (this keeps API clients working).
 */
const csrfProtection = (req, res, next) => {
  const existingToken = getCsrfCookie(req);
  const token = existingToken || setCsrfCookie(res);

  if (SAFE_METHODS.has(req.method)) return next();

  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) return next();

  if (CSRF_EXEMPT_PATHS.has(normalizePath(req.originalUrl))) return next();

  const headerToken = req.headers['x-csrf-token'];
  if (!headerToken || !existingToken || !safeEqual(headerToken, existingToken)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
    });
  }

  // Keep the cookie alive without rotating the token mid-session.
  if (!existingToken) setCsrfCookie(res, token);
  return next();
};

/** Production-only HTTPS redirect (honours reverse proxy headers). */
const enforceHttps = (req, res, next) => {
  if (!config.isProduction) return next();
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
  if (req.method === 'OPTIONS') return next();

  const host = req.headers.host;
  if (!host) {
    return res.status(400).json({ success: false, message: 'Invalid host header' });
  }

  return res.redirect(308, `https://${host}${req.originalUrl}`);
};

/** Extra headers that Helmet does not set by default. */
const additionalSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
};

module.exports = {
  cookieParser,
  csrfProtection,
  enforceHttps,
  additionalSecurityHeaders,
  safeEqual,
};
