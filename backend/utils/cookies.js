const crypto = require('crypto');
const { config } = require('../config/env');

const cookieBase = () => ({
  path: '/',
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
});

const setSessionCookie = (res, token, expiresInMs = 24 * 60 * 60 * 1000) => {
  res.cookie(config.sessionCookieName, token, {
    ...cookieBase(),
    httpOnly: true,
    maxAge: expiresInMs,
  });
};

const clearSessionCookie = (res) => {
  res.clearCookie(config.sessionCookieName, {
    ...cookieBase(),
    httpOnly: true,
  });
};

const setCsrfCookie = (res, token) => {
  const csrfToken = token || crypto.randomBytes(32).toString('hex');
  res.cookie(config.csrfCookieName, csrfToken, {
    ...cookieBase(),
    // The frontend must be able to read this value to echo it in a header.
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
  });
  return csrfToken;
};

const getCsrfCookie = (req) => req.cookies?.[config.csrfCookieName] || '';

const getSessionCookie = (req) => req.cookies?.[config.sessionCookieName] || '';

module.exports = {
  setSessionCookie,
  clearSessionCookie,
  setCsrfCookie,
  getCsrfCookie,
  getSessionCookie,
};
