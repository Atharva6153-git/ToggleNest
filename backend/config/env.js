/**
 * Central environment configuration + validation.
 *
 * Nothing here should ever print secret values. Call `validateEnv()` once at
 * boot so a misconfigured deployment fails fast instead of running insecure.
 */

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const cookieSameSite = String(
  process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')
).toLowerCase();

const config = {
  env: NODE_ENV,
  isProduction,
  isDevelopment: !isProduction && !isTest,
  isTest,

  port: parseNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  trustProxy: parseBoolean(process.env.TRUST_PROXY, isProduction),

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtIssuer: process.env.JWT_ISSUER || 'togglenest',
  jwtAudience: process.env.JWT_AUDIENCE || 'togglenest-web',
  bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),

  frontendOrigins: [
    ...(isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
    ...parseOrigins(process.env.FRONTEND_URL || process.env.CORS_ORIGINS),
  ],

  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'tn_session',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'tn_csrf',
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
  cookieSameSite,

  enableSwagger: !isProduction || parseBoolean(process.env.ENABLE_SWAGGER, false),
  // Bearer tokens are optional for non-browser API clients. Browsers always use
  // the httpOnly session cookie, so production defaults to never exposing a JWT.
  returnTokenInBody: parseBoolean(process.env.RETURN_TOKEN_IN_BODY, !isProduction),

  uploadDailyLimit: parseNumber(process.env.UPLOAD_DAILY_LIMIT, 20),
  globalRateLimit: parseNumber(process.env.GLOBAL_RATE_LIMIT, isProduction ? 300 : 2000),
  authRateLimit: parseNumber(process.env.AUTH_RATE_LIMIT, 10),
  uploadRateLimit: parseNumber(process.env.UPLOAD_RATE_LIMIT, 10),
};

const requiredInAllEnvironments = ['MONGO_URI', 'JWT_SECRET'];

const missingVariables = () =>
  requiredInAllEnvironments.filter((name) => !String(process.env[name] || '').trim());

/**
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
const validateEnv = () => {
  const errors = [];
  const warnings = [];

  const missing = missingVariables();
  if (missing.length) {
    const message = `Missing required environment variable(s): ${missing.join(', ')}`;
    if (isProduction) errors.push(message);
    else warnings.push(message);
  }

  if (config.jwtSecret && config.jwtSecret.length < 32) {
    const message = 'JWT_SECRET must be at least 32 characters long';
    if (isProduction) errors.push(message);
    else warnings.push(message);
  }

  if (isProduction && config.frontendOrigins.length === 0) {
    errors.push('FRONTEND_URL must list the production frontend origin(s)');
  }

  if (isProduction && !config.cookieSecure) {
    errors.push('COOKIE_SECURE cannot be disabled in production');
  }

  if (cookieSameSite === 'none' && !config.cookieSecure) {
    warnings.push('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }

  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    errors.push('COOKIE_SAME_SITE must be one of: lax, strict, none');
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    warnings.push(
      'Firebase Admin credentials are not configured; social login will be unavailable'
    );
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    warnings.push('Cloudinary credentials are incomplete; profile picture uploads will fail');
  }

  return { ok: errors.length === 0, errors, warnings };
};

module.exports = {
  config,
  validateEnv,
  parseBoolean,
};
