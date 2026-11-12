const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { getSessionCookie } = require('../utils/cookies');

/**
 * Accepts either a secure httpOnly session cookie (browser) or a Bearer token
 * (API clients / backwards compatibility).
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const cookieToken = getSessionCookie(req);
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Authentication required.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    req.user = decoded;
    req.authSource = bearerToken ? 'bearer' : 'cookie';
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session',
    });
  }
};

module.exports = protect;
