require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  statusCode: 429,
});

app.use(express.json());
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(limiter);

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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message || err);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});