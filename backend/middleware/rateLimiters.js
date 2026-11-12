const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');

const handler = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

const standardOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

const globalLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: config.globalRateLimit,
  handler: handler('Too many requests from this IP, please try again later.'),
});

const authLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  max: config.authRateLimit,
  skipSuccessfulRequests: true,
  handler: handler('Too many authentication attempts. Please try again in 15 minutes.'),
});

const uploadLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  max: config.uploadRateLimit,
  handler: handler('Too many uploads. Please try again later.'),
});

/**
 * Per-user daily upload budget. This is the application-side "spend cap" for
 * metered services such as Cloudinary; it complements the provider billing
 * budget documented in SECURITY.md.
 */
const dailyUploadBudget = (() => {
  const usage = new Map();
  const dayKey = () => new Date().toISOString().slice(0, 10);

  return (req, res, next) => {
    const userKey = String(req.user?.userId || req.ip || 'anonymous');
    const key = `${dayKey()}:${userKey}`;
    const current = usage.get(key) || 0;

    if (current >= config.uploadDailyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Daily upload limit reached. Please try again tomorrow.',
      });
    }

    usage.set(key, current + 1);

    // Opportunistic cleanup so the map cannot grow forever.
    if (usage.size > 10000) {
      const today = dayKey();
      for (const storedKey of usage.keys()) {
        if (!storedKey.startsWith(today)) usage.delete(storedKey);
      }
    }

    return next();
  };
})();

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  dailyUploadBudget,
};
