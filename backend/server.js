require('dotenv').config({ path:'./.env.local' });
const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const redis = require('./utils/redisClient');
const uploadRouter = require('./routes/upload');
const downloadRouter = require('./routes/download');
const app = express();
const port = process.env.PORT || 3000;
const cleanupFiles = require('./jobs/cleanup');
const locshareRouter = require('./routes/locshare');
const locdownloadRouter = require('./routes/locdownload');
const localServerRouter = require('./routes/localServer');
const cors = require('cors');
const endSessionRouter = require('./routes/endsession');
const checkSessionRouter = require('./routes/checkSession');
const sessionInfoRouter = require('./routes/sessionInfo');
const sessionDataRouter = require('./routes/sessionData');

// Rate limiter: max 100 requests per 15min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// DB connections - use cached connections for serverless
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Don't throw - allow app to start even if DB fails initially
  }
}

// Connect on startup (but don't block)
connectDB();

// Redis connection - handle errors gracefully
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', err => {
  console.error('Redis error:', err);
  // Don't crash the app
});

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
  }
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

// Add Vercel domains dynamically
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

// Allow any .vercel.app domain
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel deployments
    if (origin && (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin))) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(null, true); // Allow for now, restrict in production
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('AnonShare API is up'));
app.get('/api', (req, res) => res.send('AnonShare API is up'));

// Mount routes - Vercel will route everything here, so no /api prefix needed
app.use('/upload', uploadRouter);
app.use('/download', downloadRouter);
app.use('/locshare', locshareRouter);
app.use('/locdownload', locdownloadRouter);
app.use('/local-server', localServerRouter);
app.use('/session-info', sessionInfoRouter);
app.use('/check-session', checkSessionRouter);
app.use('/endsession', endSessionRouter);
app.use('/session-data', sessionDataRouter);

// Run cleanup periodically (only in local environment)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  setInterval(() => {
    cleanupFiles();
  }, 15 * 60 * 1000);
}

// Global error handler - prevent server crashes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit - just log it
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - just log it
});

// Export for Vercel serverless
module.exports = app;

// Only listen on port if not in Vercel (for local development)
if (!process.env.VERCEL && require.main === module) {
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}
