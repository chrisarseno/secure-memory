/**
 * Distributed Node Registry - Manages discovery and health monitoring of consciousness nodes
 */

import { EventEmitter } from 'events';
import { IStorage } from '../storage';

export interface ConsciousnessNode {
  id: string;
  address: string;
  port: number;
  capabilities: string[];
  lastSeen: Date;
  status: 'healthy' | 'degraded' | 'offline';
  load: number; // 0-1 representing current load
  consciousnessModules: string[];
  computeCapacity: number;
  region?: string;
}

export interface NodeHealthMetrics {
  nodeId: string;
  cpu: number;
  memory: number;
  consciousnessLoad: number;
  responseTime: number;
  activeConnections: number;
  timestamp: Date;
}

export class DistributedNodeRegistry extends EventEmitter {
  private nodes: Map<string, ConsciousnessNode> = new Map();
  private healthMetrics: Map<string, NodeHealthMetrics[]> = new Map();
  private storage: IStorage;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly NODE_TIMEOUT = 90000; // 90 seconds

  constructor(storage: IStorage) {
    super();
    this.storage = storage;
    this.startHealthMonitoring();
  }

  /**
   * Register a new consciousness node in the distributed cluster
   */
  async registerNode(node: Omit<ConsciousnessNode, 'lastSeen' | 'status'>): Promise<void> {
    const consciousnessNode: ConsciousnessNode = {
      ...node,
      lastSeen: new Date(),
      status: 'healthy'
    };

    this.nodes.set(node.id, consciousnessNode);
    this.healthMetrics.set(node.id, []);

    console.log(`🌐 Node registered: ${node.id} at ${node.address}:${node.port}`);
    console.log(`   Capabilities: ${node.capabilities.join(', ')}`);
    console.log(`   Consciousness Modules: ${node.consciousnessModules.join(', ')}`);

    this.emit('node-registered', consciousnessNode);

    // Persist to storage (TODO: Add distributed node storage to IStorage interface)
    try {
      // await this.storage.storeDistributedNode(consciousnessNode);
      console.log(`📦 Node ${node.id} registered (persistence TODO)`);
    } catch (error) {
      console.error(`Failed to persist node ${node.id}:`, error);
    }
  }

  /**
   * Update node health metrics
   */
  async updateNodeHealth(nodeId: string, metrics: Omit<NodeHealthMetrics, 'nodeId' | 'timestamp'>): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      console.warn(`⚠️  Health update for unknown node: ${nodeId}`);
      return;
    }

    // Update node status
    node.lastSeen = new Date();
    node.load = metrics.consciousnessLoad;
    
    // Determine status based on metrics
    if (metrics.cpu > 0.9 || metrics.memory > 0.9 || metrics.responseTime > 5000) {
      node.status = 'degraded';
    } else {
      node.status = 'healthy';
    }

    // Store health metrics (keep last 100 entries per node)
    const healthHistory = this.healthMetrics.get(nodeId) || [];
    healthHistory.push({
      nodeId,
      ...metrics,
      timestamp: new Date()
    });

    if (healthHistory.length > 100) {
      healthHistory.splice(0, healthHistory.length - 100);
    }

    this.healthMetrics.set(nodeId, healthHistory);
    this.emit('node-health-updated', { nodeId, node, metrics });
  }

  /**
   * Get all healthy nodes that support specific consciousness modules
   */
  getNodesForModules(modules: string[]): ConsciousnessNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      node.status === 'healthy' &&
      modules.some(module => node.consciousnessModules.includes(module))
    );
  }

  /**
   * Find the best node for a specific consciousness task based on load and capabilities
   */
  getBestNodeForTask(requiredCapabilities: string[], preferredModules: string[] = []): ConsciousnessNode | null {
    const eligibleNodes = Array.from(this.nodes.values()).filter(node => 
      node.status === 'healthy' &&
      requiredCapabilities.every(cap => node.capabilities.includes(cap))
    );

    if (eligibleNodes.length === 0) return null;

    // Score nodes based on load, module availability, and response time
    const scoredNodes = eligibleNodes.map(node => {
      let score = 1.0 - node.load; // Lower load = higher score
      
      // Bonus for having preferred modules
      const moduleMatchCount = preferredModules.filter(module => 
        node.consciousnessModules.includes(module)
      ).length;
      score += (moduleMatchCount / Math.max(1, preferredModules.length)) * 0.3;

      // Bonus for higher compute capacity
      score += (node.computeCapacity / 100) * 0.2;

      return { node, score };
    });

    scoredNodes.sort((a, b) => b.score - a.score);
    return scoredNodes[0].node;
  }

  /**
   * Get cluster overview with health statistics
   */
  getClusterOverview(): {
    totalNodes: number;
    healthyNodes: number;
    degradedNodes: number;
    offlineNodes: number;
    totalCapacity: number;
    averageLoad: number;
    nodesByRegion: Record<string, number>;
  } {
    const nodes = Array.from(this.nodes.values());
    const healthyNodes = nodes.filter(n => n.status === 'healthy');
    const degradedNodes = nodes.filter(n => n.status === 'degraded');
    const offlineNodes = nodes.filter(n => n.status === 'offline');

    const totalCapacity = nodes.reduce((sum, node) => sum + node.computeCapacity, 0);
    const averageLoad = nodes.length > 0 
      ? nodes.reduce((sum, node) => sum + node.load, 0) / nodes.length 
      : 0;

    const nodesByRegion: Record<string, number> = {};
    nodes.forEach(node => {
      const region = node.region || 'unknown';
      nodesByRegion[region] = (nodesByRegion[region] || 0) + 1;
    });

    return {
      totalNodes: nodes.length,
      healthyNodes: healthyNodes.length,
      degradedNodes: degradedNodes.length,
      offlineNodes: offlineNodes.length,
      totalCapacity,
      averageLoad,
      nodesByRegion
    };
  }

  /**
   * Remove a node from the registry
   */
  async deregisterNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      this.healthMetrics.delete(nodeId);
      console.log(`🔴 Node deregistered: ${nodeId}`);
      this.emit('node-deregistered', node);
    }
  }

  /**
   * Start periodic health monitoring of all registered nodes
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    console.log('🔍 Node health monitoring started');
  }

  /**
   * Perform health checks on all registered nodes
   */
  private async performHealthChecks(): Promise<void> {
    const now = new Date();
    
    for (const nodeId of this.nodes.keys()) {
      const node = this.nodes.get(nodeId)!;
      const timeSinceLastSeen = now.getTime() - node.lastSeen.getTime();
      
      if (timeSinceLastSeen > this.NODE_TIMEOUT) {
        if (node.status !== 'offline') {
          node.status = 'offline';
          console.warn(`⚠️  Node ${nodeId} marked as offline (last seen ${timeSinceLastSeen}ms ago)`);
          this.emit('node-offline', node);
        }
      }
    }
  }

  /**
   * Get all registered nodes
   */
  getAllNodes(): ConsciousnessNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a specific node by ID
   */
  getNode(nodeId: string): ConsciousnessNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get health history for a specific node
   */
  getNodeHealthHistory(nodeId: string): NodeHealthMetrics[] {
    return this.healthMetrics.get(nodeId) || [];
  }

  /**
   * Shutdown the registry and cleanup resources
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.nodes.clear();
    this.healthMetrics.clear();
    console.log('🔴 Node registry shutdown complete');
  }
}