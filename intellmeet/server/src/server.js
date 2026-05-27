import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { initSocket } from './sockets/socket.server.js';
import logger from './utils/logger.js';

// Setup Uncaught Exception Handler
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception detected! Shutting down...', error);
  process.exit(1);
});

logger.info('Initializing IntellMeet Backend Engine...');

// Create standard HTTP Server wrapper for Express application
const server = http.createServer(app);

// Initialize real-time Socket.io server foundation
initSocket(server);
logger.info('Socket server initialized.');

// Establish connection to MongoDB Atlas
await connectDB();
logger.info('MongoDB connected.');

// Listen on configured cloud port
const PORT = env.PORT;
server.listen(PORT, () => {
  logger.info(`Server running successfully on port ${PORT} [Mode: ${env.NODE_ENV}]`);
});

// Setup Unhandled Promise Rejection Handler
process.on('unhandledRejection', (error) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected! Initiating graceful shutdown...', error);
  
  // Close HTTP Server first
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    // Close MongoDB connections
    await closeDB();
    
    logger.info('Graceful shutdown completed. Exiting process.');
    process.exit(1);
  });
});

// Handle standard OS signals for graceful termination (e.g. Render/Railway redeployments)
const handleSignalTermination = (signal) => {
  logger.info(`Received OS termination signal: ${signal}. Initiating graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    await closeDB();
    logger.info('Graceful shutdown completed successfully. Exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleSignalTermination('SIGTERM'));
process.on('SIGINT', () => handleSignalTermination('SIGINT'));
