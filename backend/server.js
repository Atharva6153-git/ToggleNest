require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');

const { config, validateEnv } = require('./config/env');
const swaggerSpec = require('./config/swagger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { cookieParser, csrfProtection, enforceHttps, additionalSecurityHeaders } = require('./middleware/security');
const { sanitizeInputs } = require('./middleware/sanitizeInput');
const { globalLimiter } = require('./middleware/rateLimiters');
const protect = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');

const sanitizeMongoKeys = (obj) => {
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeMongoKeys);
    return;
  }
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeMongoKeys(obj[key]);
      }
    });
  }
};

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);

// Strict CORS: only configured frontend origins are allowed, with credentials
// so the httpOnly session cookie can be used.
const allowedOrigins = new Set(config.frontendOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin (curl, server-to-server, mobile clients).
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      const error = new Error('Origin not allowed by CORS');
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: [],
    maxAge: 600,
  })
);

app.use(enforceHttps);

app.use(
  helmet({
    contentSecurityPolicy: config.isProduction
      ? {
          useDefaults: false,
          directives: {
            defaultSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: config.isProduction
      ? { maxAge: 15552000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
  })
);
app.use(additionalSecurityHeaders);
app.use(cookieParser);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

app.use((req, res, next) => {
  sanitizeMongoKeys(req.body);
  sanitizeMongoKeys(req.params);
  try {
    sanitizeMongoKeys(req.query);
  } catch {
    // Express 5 may expose a read-only query object.
  }
  next();
});
app.use(sanitizeInputs);
app.use(hpp());
app.use(csrfProtection);
app.use(globalLimiter);

if (!config.isProduction) {
  app.use(morgan('dev'));
}

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Task routes
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

// Project routes
const projectRoutes = require('./routes/projectRoutes');
app.use('/api/projects', projectRoutes);

// Activity log routes
const activityLogRoutes = require('./routes/activityLogRoutes');
app.use('/api/activity-logs', activityLogRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Comment routes
const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);

// API documentation is disabled in production unless explicitly enabled and
// is then limited to authenticated admins.
if (config.enableSwagger) {
  const swaggerGuards = config.isProduction
    ? [protect, roleMiddleware('admin')]
    : [];
  app.use(
    '/api-docs',
    ...swaggerGuards,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: { persistAuthorization: true },
    })
  );
}

app.get('/', (req, res) => {
  res.json({ message: 'Togglenest backend is running' });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  const result = validateEnv();
  result.warnings.forEach((warning) => console.warn(`[config] ${warning}`));

  if (!result.ok) {
    result.errors.forEach((error) => console.error(`[config] ${error}`));
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    const shutdown = async () => {
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message || err);
    process.exit(1);
  }
};

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
