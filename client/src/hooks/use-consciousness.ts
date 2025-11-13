import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import type { SystemMetrics } from "../../../shared/schema";

export function useConsciousness() {
  const [realTimeMetrics, setRealTimeMetrics] = useState<SystemMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Initialize WebSocket connection
  const { socket, isConnected } = useWebSocket();

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Listen for real-time metrics updates
  useEffect(() => {
    if (socket) {
      socket.on('metrics-update', (metrics: SystemMetrics) => {
        setRealTimeMetrics(metrics);
      });

      return () => {
        socket.off('metrics-update');
      };
    }
  }, [socket]);

  // Fetch initial metrics
  const { data: initialMetrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['/api/metrics'],
    refetchInterval: 10000,
  });

  // Use real-time metrics if available, otherwise fallback to API data
  const metrics = realTimeMetrics || initialMetrics;

  return {
    metrics,
    connectionStatus,
    isLoading: metricsLoading,
    socket,
  };
}
