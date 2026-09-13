const User = require('../models/User');

const roleMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId).select('role');
      const role = user ? user.role : null;

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({
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