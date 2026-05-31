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
    pingTimeout: 60000,
    pingInterval: 25000,
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

      // Retrieve all other active socket IDs currently in this room to enable WebRTC mesh initialization
      const roomClients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .filter(id => id !== socket.id);

      // Confirm success to current client, passing other active peers
      socket.emit('joined-room-success', { 
        roomId, 
        activePeers: roomClients 
      });
    });

    /**
     * WebRTC Mesh Signaling Handshakes
     */
    socket.on('webrtc-offer', ({ targetId, offer }) => {
      if (!targetId || !offer) return;
      logger.debug(`Relaying WebRTC SDP offer from ${socket.id} to peer ${targetId}`);
      io.to(targetId).emit('webrtc-offer', {
        senderId: socket.id,
        offer
      });
    });

    socket.on('webrtc-answer', ({ targetId, answer }) => {
      if (!targetId || !answer) return;
      logger.debug(`Relaying WebRTC SDP answer from ${socket.id} to peer ${targetId}`);
      io.to(targetId).emit('webrtc-answer', {
        senderId: socket.id,
        answer
      });
    });

    socket.on('webrtc-candidate', ({ targetId, candidate }) => {
      if (!targetId || !candidate) return;
      logger.debug(`Relaying WebRTC ICE candidate from ${socket.id} to peer ${targetId}`);
      io.to(targetId).emit('webrtc-candidate', {
        senderId: socket.id,
        candidate
      });
    });

    /**
     * Peer Media Controls Sync: Syncs camera, microphone, and screen share events
     */
    socket.on('peer-media-toggle', ({ roomId, isMuted, isCameraOff, isSharingScreen }) => {
      if (!roomId) return;
      logger.debug(`Syncing media toggles from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('peer-media-toggled', {
        senderId: socket.id,
        isMuted,
        isCameraOff,
        isSharingScreen
      });
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
