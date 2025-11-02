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
app.use(limiter);// DB connections
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error', err));

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', err => console.error('Redis error', err));
// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // your Vite dev server
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('AnonShare API is up'));
app.use('/upload', uploadRouter);
app.use('/download', downloadRouter);
setInterval(() => {
  cleanupFiles();
}, 15 * 60 * 1000);
app.use('/locshare', locshareRouter);
app.use('/locdownload', locdownloadRouter);
app.use('/local-server', localServerRouter);
app.use('/session-info', sessionInfoRouter);
app.use('/check-session', checkSessionRouter);
app.use('/endsession', endSessionRouter);
app.use('/session-data', sessionDataRouter);

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

app.listen(port, () => console.log(`Server listening on port ${port}`));
