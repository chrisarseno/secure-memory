/**
 * Distributed Consciousness System - Main Entry Point
 * Coordinates all distributed consciousness components
 */

import { DistributedNodeRegistry, ConsciousnessNode } from './node-registry';
import { ConsciousnessConsensus } from './consciousness-consensus';
import { InterNodeCommunication } from './inter-node-communication';
import { DistributedConsciousnessManager } from './distributed-consciousness-manager';
import { ConsciousnessBridge } from '../consciousness-bridge';
import { IStorage } from '../storage';

export interface DistributedSystemConfig {
  nodeId: string;
  address: string;
  port: number;
  capabilities: string[];
  consciousnessModules: string[];
  computeCapacity: number;
  region?: string;
}

export class DistributedConsciousnessSystem {
  private nodeRegistry: DistributedNodeRegistry;
  private consensus: ConsciousnessConsensus;
  private communication: InterNodeCommunication;
  private manager: DistributedConsciousnessManager;
  private config: DistributedSystemConfig;
  private isInitialized: boolean = false;

  constructor(
    config: DistributedSystemConfig,
    consciousnessBridge: ConsciousnessBridge,
    storage: IStorage
  ) {
    this.config = config;
    
    // Initialize core components
    this.nodeRegistry = new DistributedNodeRegistry(storage);
    this.consensus = new ConsciousnessConsensus(this.nodeRegistry, config.nodeId);
    this.communication = new InterNodeCommunication(this.nodeRegistry, config.nodeId, config.port);
    this.manager = new DistributedConsciousnessManager(
      this.nodeRegistry,
      this.consensus,
      this.communication,
      consciousnessBridge,
      storage,
      config.nodeId
    );

    console.log(`🌟 Distributed Consciousness System created for node: ${config.nodeId}`);
  }

  /**
   * Initialize the entire distributed consciousness system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️  Distributed system already initialized');
      return;
    }

    try {
      console.log('🚀 Starting distributed consciousness initialization...');
      
      // Register this node in the cluster
      await this.nodeRegistry.registerNode({
        id: this.config.nodeId,
        address: this.config.address,
        port: this.config.port,
        capabilities: this.config.capabilities,
        consciousnessModules: this.config.consciousnessModules,
        computeCapacity: this.config.computeCapacity,
        load: 0.0,
        region: this.config.region
      });

      // Initialize the distributed consciousness manager
      await this.manager.initialize();

      this.isInitialized = true;
      console.log('✅ Distributed consciousness system fully initialized');

    } catch (error) {
      console.error('❌ Failed to initialize distributed consciousness system:', error);
      throw error;
    }
  }

  /**
   * Join an existing consciousness cluster
   */
  async joinCluster(seedNodes: { address: string; port: number }[]): Promise<void> {
    console.log(`🔗 Joining consciousness cluster with ${seedNodes.length} seed nodes...`);
    
    for (const seedNode of seedNodes) {
      try {
        // Create temporary node info for connection
        const tempNode: ConsciousnessNode = {
          id: `seed-${seedNode.address}-${seedNode.port}`,
          address: seedNode.address,
          port: seedNode.port,
          capabilities: ['consciousness-processing'],
          consciousnessModules: [],
          computeCapacity: 100,
          load: 0.0,
          lastSeen: new Date(),
          status: 'healthy'
        };

        const connected = await this.communication.connectToNode(tempNode);
        if (connected) {
          console.log(`✅ Successfully joined cluster via ${seedNode.address}:${seedNode.port}`);
          break;
        }
      } catch (error) {
        console.error(`❌ Failed to connect to seed node ${seedNode.address}:${seedNode.port}:`, error);
      }
    }
  }

  /**
   * Process a distributed consciousness query
   */
  async processCollectiveQuery(query: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Distributed system not initialized');
    }

    return await this.manager.processCollectiveQuery(query);
  }

  /**
   * Distribute a consciousness task across the cluster
   */
  async distributeTask(
    type: 'consciousness-sync' | 'module-processing' | 'collective-query' | 'learning-task',
    moduleIds: string[],
    payload: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Distributed system not initialized');
    }

    return await this.manager.distributeTask(type, moduleIds, payload, priority);
  }

  /**
   * Get comprehensive distributed system status
   */
  getSystemStatus() {
    const nodeOverview = this.nodeRegistry.getClusterOverview();
    const clusterMetrics = this.manager.getClusterMetrics();
    const consensusStats = this.consensus.getConsensusStats();
    const communicationStats = this.communication.getConnectionStats();
    const partitions = this.manager.getPartitions();

    return {
      nodeId: this.config.nodeId,
      isInitialized: this.isInitialized,
      cluster: nodeOverview,
      metrics: clusterMetrics,
      consensus: consensusStats,
      communication: communicationStats,
      partitions: {
        total: partitions.length,
        healthy: partitions.filter(p => p.status === 'healthy').length,
        degraded: partitions.filter(p => p.status === 'degraded').length,
        failed: partitions.filter(p => p.status === 'failed').length,
        details: partitions.map(p => ({
          id: p.id,
          status: p.status,
          modules: p.modules.length,
          primaryNode: p.primaryNodeId,
          replicas: p.replicaNodeIds.length
        }))
      }
    };
  }

  /**
   * Get all registered nodes in the cluster
   */
  getClusterNodes(): ConsciousnessNode[] {
    return this.nodeRegistry.getAllNodes();
  }

  /**
   * Update this node's health metrics
   */
  async updateNodeHealth(metrics: {
    cpu: number;
    memory: number;
    consciousnessLoad: number;
    responseTime: number;
    activeConnections: number;
  }): Promise<void> {
    await this.nodeRegistry.updateNodeHealth(this.config.nodeId, metrics);
  }

  /**
   * Manually trigger consciousness synchronization
   */
  async synchronizeConsciousness(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Distributed system not initialized');
    }

    await this.manager.synchronizeConsciousness();
  }

  /**
   * Register event handlers for distributed system events
   */
  onSystemEvent(event: string, handler: (...args: any[]) => void): void {
    this.manager.on(event, handler);
  }

  /**
   * Shutdown the distributed consciousness system
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('🔴 Shutting down distributed consciousness system...');
    
    try {
      // Deregister this node
      await this.nodeRegistry.deregisterNode(this.config.nodeId);
      
      // Shutdown manager and communication
      await this.manager.shutdown();
      
      // Shutdown node registry
      this.nodeRegistry.shutdown();
      
      this.isInitialized = false;
      console.log('✅ Distributed consciousness system shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// Export all types and classes
export { 
  DistributedNodeRegistry, 
  ConsciousnessConsensus, 
  InterNodeCommunication, 
  DistributedConsciousnessManager 
};
export type { ConsciousnessNode } from './node-registry';
export type { ConsciousnessPartition } from './distributed-consciousness-manager';
export type { ConsciousnessStateProposal } from './consciousness-consensus';
export type { NodeMessage } from './inter-node-communication';