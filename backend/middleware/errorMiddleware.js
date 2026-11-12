const { config } = require('../config/env');

const notFound = (req, res, next) => {
  const error = new Error(
    config.isProduction ? 'Route not found' : `Route not found: ${req.originalUrl}`
  );
  error.statusCode = 404;
  next(error);
};

const normalizeError = (err) => {
  if (err.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: Object.values(err.errors)
        .map((item) => item.message)
        .join(', ') || 'Validation failed',
    };
  }

  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid value for ${err.path || 'identifier'}` };
  }

  if (err.code === 11000) {
    return { statusCode: 409, message: 'A record with those details already exists' };
  }

  if (err.name === 'MulterError') {
    return {
      statusCode: 400,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large'
          : 'File upload failed validation',
    };
  }

  if (err.type === 'entity.too.large') {
    return { statusCode: 413, message: 'Request payload is too large' };
  }

  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Malformed JSON payload' };
  }

  return {
    statusCode: err.statusCode || err.status || 500,
    message: err.message || 'Server error',
  };
};

const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);
  const isServerError = normalized.statusCode >= 500;

  // Never leak stack traces or database internals to clients in production.
  const publicMessage =
    isServerError && config.isProduction ? 'Internal server error' : normalized.message;

  if (config.isProduction) {
    console.error(
      `[error] ${req.method} ${req.originalUrl} -> ${normalized.statusCode}: ${err.message}`
    );
  } else {
    console.error(`Error: ${err.message}`);
    if (isServerError && err.stack) console.error(err.stack);
  }

  const payload = {
    success: false,
    message: publicMessage,
  };

  if (!config.isProduction && isServerError && err.stack) {
    payload.stack = err.stack;
  }

  return res.status(normalized.statusCode).json(payload);
};

module.exports = {
  notFound,
  errorHandler,
};
