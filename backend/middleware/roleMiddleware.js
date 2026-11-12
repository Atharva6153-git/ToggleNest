const User = require('../models/User');

/**
 * Role guard. Always re-reads the role from MongoDB so a stale JWT cannot keep
 * admin privileges after the account has been demoted.
 */
const roleMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?._id;
      const user = userId ? await User.findById(userId).select('role') : null;
      const role = user ? user.role : null;

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }

      req.user.role = role;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = roleMiddleware;
