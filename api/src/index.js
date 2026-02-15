import express from 'express';
import dotenv from 'dotenv';
import { initializeDB, closeDB, queryOne } from './db.js';
import routes from './routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Mount routes under /api prefix
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await queryOne('SELECT 1 as ok');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), environment: NODE_ENV, database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString(), error: 'Database unavailable' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
async function start() {
  try {
    await initializeDB();
    console.log('Database initialized');

    const server = app.listen(PORT, () => {
      console.log(`Time Tracking API server running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`${signal} received, starting graceful shutdown`);
      server.close(async (err) => {
        if (err) console.error('Error closing server:', err);
        await closeDB();
        process.exit(err ? 1 : 0);
      });
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only auto-start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
export { start };
