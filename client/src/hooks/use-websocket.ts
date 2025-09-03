import { useState, useEffect } from "react";
import { initializeSocket, getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    // Set up connection event listeners
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('reconnect', () => {
      setIsConnected(true);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('reconnect');
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    socket,
    isConnected,
  };
}
