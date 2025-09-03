import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    
    socket.on('connect', () => {
      console.log('Connected to consciousness system');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from consciousness system');
    });
  }
  
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
