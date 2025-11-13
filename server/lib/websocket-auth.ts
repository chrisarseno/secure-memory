import { Socket } from 'socket.io';
import type { Request } from 'express';
import pino from 'pino';
import { env } from '../env';

const logger = pino({ level: env.LOG_LEVEL });

/**
 * Wrap Express middleware for Socket.IO
 * Allows us to reuse Express session middleware for WebSocket connections
 */
export function wrapMiddleware(middleware: any) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const req = socket.request as Request;
    const res = {
      getHeader: () => undefined,
      setHeader: () => undefined,
      end: () => undefined,
    };
    middleware(req, res, next);
  };
}

/**
 * WebSocket authentication middleware
 * Checks if the user has a valid session
 */
export function requireWebSocketAuth(socket: Socket, next: (err?: Error) => void) {
  const req = socket.request as Request & { session?: any };

  // Check if session exists and user is authenticated
  if (!req.session || !req.session.authenticated || !req.session.user) {
    logger.warn({
      socketId: socket.id,
      sessionId: req.session?.id
    }, '⚠️  Unauthorized WebSocket connection attempt');

    return next(new Error('Unauthorized: Please authenticate via HTTP first'));
  }

  // Add user info to socket data for easy access
  socket.data.userId = req.session.user.id;
  socket.data.username = req.session.user.username;
  socket.data.sessionId = req.session.id;

  logger.info({
    socketId: socket.id,
    userId: socket.data.userId,
    username: socket.data.username
  }, '✅ WebSocket authenticated');

  next();
}

/**
 * Check if a socket has an authenticated session
 */
export function isSocketAuthenticated(socket: Socket): boolean {
  return !!(socket.data.userId && socket.data.username);
}

/**
 * Get user info from socket
 */
export function getSocketUser(socket: Socket): { id: string; username: string } | null {
  if (!isSocketAuthenticated(socket)) {
    return null;
  }

  return {
    id: socket.data.userId,
    username: socket.data.username,
  };
}

/**
 * Middleware to check authentication on specific events
 */
export function createAuthGuard(eventName: string) {
  return (socket: Socket, data: any, callback?: Function) => {
    if (!isSocketAuthenticated(socket)) {
      logger.warn({
        socketId: socket.id,
        event: eventName
      }, '⚠️  Unauthorized event access attempt');

      socket.emit('auth-required', {
        event: eventName,
        message: 'Authentication required for this feature',
      });

      if (callback) {
        callback({ error: 'Unauthorized' });
      }

      return false;
    }

    return true;
  };
}
