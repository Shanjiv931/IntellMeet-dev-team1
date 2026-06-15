import dns from 'dns';
import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { seedDatabaseSilent } from './config/dbInit.js';
import { initSocket } from './sockets/socket.server.js';
import logger from './utils/logger.js';

// Configure DNS to resolve SRV records on local environments
dns.setServers(['8.8.8.8', '1.1.1.1']);

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

// Listen on configured cloud port immediately (non-blocking)
const PORT = env.PORT;
server.listen(PORT, async () => {
  logger.info(`Server running successfully on port ${PORT} [Mode: ${env.NODE_ENV}]`);

  // Establish connection to MongoDB Atlas in the background
  try {
    await connectDB();
    logger.info('MongoDB connection process finalized.');
    
    // Compile database collections and seed indexes on boot automatically once connected
    await seedDatabaseSilent();
  } catch (err) {
    logger.error('MongoDB background connection failed:', err);
  }
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
