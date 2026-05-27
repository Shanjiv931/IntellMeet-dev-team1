import { Server } from 'socket.io';
import env from '../config/env.js';
import logger from '../utils/logger.js';

let io = null;

/**
 * Initialize Socket.io Server attached to standard Node HTTP Server.
 * @param {object} httpServer - Node HTTP server instance
 * @returns {object} Configured Socket.io Server instance
 */
export const initSocket = (httpServer) => {
  if (io) {
    logger.warn('Socket.io server already initialized. Reusing active instance.');
    return io;
  }

  logger.info('Initializing Socket.io server foundation...');

  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds ping timeout
    pingInterval: 25000, // 25 seconds ping interval
  });

  // Global socket namespace connection listener
  io.on('connection', (socket) => {
    logger.info(`New websocket client connected. Socket ID: ${socket.id}`);

    // Track rooms this socket has actively joined
    const activeRooms = new Set();

    /**
     * join-room Event: Allows a client to join a specific meeting room
     */
    socket.on('join-room', (roomId) => {
      if (!roomId) {
        logger.warn(`Client ${socket.id} attempted to join room with empty ID.`);
        return socket.emit('error', { message: 'Invalid room identification' });
      }

      socket.join(roomId);
      activeRooms.add(roomId);
      
      logger.info(`Client ${socket.id} successfully joined room: ${roomId}`);

      // Broadcast event notification to all other users in the room
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        message: `Client ${socket.id} joined the room.`,
      });

      // Confirm success to current client
      socket.emit('joined-room-success', { roomId });
    });

    /**
     * leave-room Event: Allows a client to leave a specific room
     */
    socket.on('leave-room', (roomId) => {
      if (!roomId) return;

      socket.leave(roomId);
      activeRooms.delete(roomId);

      logger.info(`Client ${socket.id} left room: ${roomId}`);

      // Broadcast notification
      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        message: `Client ${socket.id} left the room.`,
      });

      socket.emit('left-room-success', { roomId });
    });

    /**
     * message Event: Broadcasts custom real-time messaging payloads within a room
     */
    socket.on('message', (payload) => {
      const { roomId, message, senderName } = payload || {};

      if (!roomId || !message) {
        logger.warn(`Client ${socket.id} attempted message transmission with missing parameters.`);
        return socket.emit('error', { message: 'Failed to deliver. Missing roomId or message content.' });
      }

      logger.debug(`Room [${roomId}] Message from ${senderName || 'Anonymous'}: ${message}`);

      // Route message strictly within the targeted room
      io.to(roomId).emit('room-message', {
        senderId: socket.id,
        senderName: senderName || 'Guest User',
        message,
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * disconnect Event: Standard cleanup operations when client connection terminates
     */
    socket.on('disconnect', () => {
      logger.info(`Websocket client disconnected. Socket ID: ${socket.id}`);

      // Gracefully exit and notify all active rooms this socket resided in
      activeRooms.forEach((roomId) => {
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          message: `Client ${socket.id} disconnected from network.`,
        });
      });
      
      activeRooms.clear();
    });
  });

  logger.info('Socket server initialized successfully.');
  return io;
};

/**
 * Retrieve active Socket.io Server instance
 * @returns {object} Socket.io Server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io server has not been initialized yet!');
  }
  return io;
};
