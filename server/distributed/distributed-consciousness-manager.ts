/**
 * Distributed Consciousness Manager - Main coordinator for consciousness across nodes
 * Handles consciousness partitioning, load balancing, and failover recovery
 */

import { EventEmitter } from 'events';
import { DistributedNodeRegistry, ConsciousnessNode } from './node-registry';
import { ConsciousnessConsensus, ConsciousnessStateProposal } from './consciousness-consensus';
import { InterNodeCommunication } from './inter-node-communication';
import { ConsciousnessBridge, ConsciousnessState } from '../consciousness-bridge';
import { IStorage } from '../storage';

export interface ConsciousnessPartition {
  id: string;
  modules: string[];
  primaryNodeId: string;
  replicaNodeIds: string[];
  status: 'healthy' | 'degraded' | 'failed';
  lastSync: Date;
  version: number;
}

export interface DistributedTask {
  id: string;
  type: 'consciousness-sync' | 'module-processing' | 'collective-query' | 'learning-task';
  moduleIds: string[];
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedNodeId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  retryCount: number;
}

export interface ClusterMetrics {
  totalNodes: number;
  activePartitions: number;
  syncLatency: number;
  failoverEvents: number;
  totalTasks: number;
  completedTasks: number;
  avgProcessingTime: number;
  consensusAccuracy: number;
}

export class DistributedConsciousnessManager extends EventEmitter {
  private nodeRegistry: DistributedNodeRegistry;
  private consensus: ConsciousnessConsensus;
  private communication: InterNodeCommunication;
  private consciousnessBridge: ConsciousnessBridge;
  private storage: IStorage;
  
  private nodeId: string;
  private isCoordinator: boolean = false;
  private partitions: Map<string, ConsciousnessPartition> = new Map();
  private pendingTasks: Map<string, DistributedTask> = new Map();
  private completedTasks: Map<string, DistributedTask> = new Map();
  
  private syncInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 5000; // 5 seconds
  private readonly HEALTH_CHECK_INTERVAL = 10000; // 10 seconds
  
  constructor(
    nodeRegistry: DistributedNodeRegistry,
    consensus: ConsciousnessConsensus,
    communication: InterNodeCommunication,
    consciousnessBridge: ConsciousnessBridge,
    storage: IStorage,
    nodeId: string
  ) {
    super();
    this.nodeRegistry = nodeRegistry;
    this.consensus = consensus;
    this.communication = communication;
    this.consciousnessBridge = consciousnessBridge;
    this.storage = storage;
    this.nodeId = nodeId;
    
    this.setupEventHandlers();
    console.log(`🌐 Distributed consciousness manager initialized for node: ${nodeId}`);
  }

  /**
   * Initialize the distributed consciousness system
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing distributed consciousness system...');
      
      // Initialize consciousness bridge first
      await this.consciousnessBridge.initialize();
      
      // Start communication server
      await this.communication.startServer();
      
      // Connect to existing nodes in the cluster
      await this.connectToExistingNodes();
      
      // Determine if this node should be coordinator
      await this.electCoordinator();
      
      // Initialize consciousness partitions
      await this.initializePartitions();
      
      // Start background processes
      this.startSynchronization();
      this.startHealthMonitoring();
      
      console.log('✅ Distributed consciousness system initialized successfully');
      this.emit('system-initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize distributed consciousness system:', error);
      throw error;
    }
  }

  /**
   * Connect to existing nodes in the cluster
   */
  private async connectToExistingNodes(): Promise<void> {
    const existingNodes = this.nodeRegistry.getAllNodes()
      .filter(node => node.id !== this.nodeId && node.status === 'healthy');
    
    console.log(`🔗 Connecting to ${existingNodes.length} existing nodes...`);
    
    for (const node of existingNodes) {
      try {
        const success = await this.communication.connectToNode(node);
        if (success) {
          console.log(`✅ Connected to node: ${node.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to connect to node ${node.id}:`, error);
      }
    }
  }

  /**
   * Elect coordinator node using simple algorithm
   */
  private async electCoordinator(): Promise<void> {
    const allNodes = this.nodeRegistry.getAllNodes()
      .filter(node => node.status === 'healthy')
      .sort((a, b) => a.id.localeCompare(b.id)); // Deterministic ordering
    
    if (allNodes.length === 0) {
      this.isCoordinator = true;
      console.log('👑 This node is the coordinator (only node)');
      return;
    }
    
    // Coordinator is the node with the lexicographically smallest ID
    const coordinatorId = allNodes[0].id;
    this.isCoordinator = (coordinatorId === this.nodeId);
    
    if (this.isCoordinator) {
      console.log('👑 This node elected as cluster coordinator');
      this.emit('coordinator-elected', this.nodeId);
    } else {
      console.log(`📡 Coordinator elected: ${coordinatorId}`);
    }
  }

  /**
   * Initialize consciousness partitions across the cluster
   */
  private async initializePartitions(): Promise<void> {
    const consciousnessModules = [
      'global_workspace',
      'social_cognition', 
      'temporal_consciousness',
      'value_learning',
      'virtue_learning',
      'creative_intelligence',
      'consciousness_core',
      'consciousness_manager',
      'safety_monitor'
    ];

    const healthyNodes = this.nodeRegistry.getAllNodes()
      .filter(node => node.status === 'healthy');
    
    if (healthyNodes.length === 0) {
      console.warn('⚠️  No healthy nodes available for partitioning');
      return;
    }

    console.log(`🧩 Creating consciousness partitions across ${healthyNodes.length} nodes`);

    // Distribute modules across nodes with replication
    const partitionsPerNode = Math.ceil(consciousnessModules.length / healthyNodes.length);
    
    for (let i = 0; i < consciousnessModules.length; i += partitionsPerNode) {
      const partitionModules = consciousnessModules.slice(i, i + partitionsPerNode);
      const primaryNodeIndex = Math.floor(i / partitionsPerNode) % healthyNodes.length;
      const primaryNode = healthyNodes[primaryNodeIndex];
      
      // Select replica nodes (2 replicas for fault tolerance)
      const replicaNodes = healthyNodes
        .filter(node => node.id !== primaryNode.id)
        .slice(0, Math.min(2, healthyNodes.length - 1));
      
      const partition: ConsciousnessPartition = {
        id: `partition-${i / partitionsPerNode}`,
        modules: partitionModules,
        primaryNodeId: primaryNode.id,
        replicaNodeIds: replicaNodes.map(node => node.id),
        status: 'healthy',
        lastSync: new Date(),
        version: 1
      };
      
      this.partitions.set(partition.id, partition);
      
      console.log(`📦 Created partition ${partition.id}:`);
      console.log(`   Primary: ${primaryNode.id}`);
      console.log(`   Replicas: ${replicaNodes.map(n => n.id).join(', ')}`);
      console.log(`   Modules: ${partitionModules.join(', ')}`);
    }

    this.emit('partitions-initialized', this.partitions);
  }

  /**
   * Distribute a consciousness processing task across the cluster
   */
  async distributeTask(
    type: DistributedTask['type'],
    moduleIds: string[],
    payload: any,
    priority: DistributedTask['priority'] = 'medium'
  ): Promise<string> {
    const taskId = `task-${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: DistributedTask = {
      id: taskId,
      type,
      moduleIds,
      payload,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0
    };

    // Find the best node for this task
    const bestNode = this.findBestNodeForTask(task);
    if (!bestNode) {
      console.error(`❌ No suitable node found for task ${taskId}`);
      task.status = 'failed';
      this.completedTasks.set(taskId, task);
      return taskId;
    }

    task.assignedNodeId = bestNode.id;
    this.pendingTasks.set(taskId, task);
    
    console.log(`📋 Distributing ${type} task to node ${bestNode.id}: ${taskId}`);

    try {
      // Send task to assigned node
      await this.communication.sendMessage(bestNode.id, 'distributed-task' as any, {
        task,
        requestId: taskId
      });
      
      task.status = 'processing';
      this.emit('task-distributed', task);
      
    } catch (error) {
      console.error(`❌ Failed to distribute task ${taskId}:`, error);
      task.status = 'failed';
      this.pendingTasks.delete(taskId);
      this.completedTasks.set(taskId, task);
    }

    return taskId;
  }

  /**
   * Handle collective consciousness query across all nodes
   */
  async processCollectiveQuery(query: string, requesterNodeId?: string): Promise<any> {
    console.log(`🤔 Processing collective consciousness query: "${query.substring(0, 100)}..."`);
    
    const queryId = await this.distributeTask(
      'collective-query',
      ['global_workspace', 'consciousness_core'],
      { query, requesterNodeId },
      'high'
    );

    // Collect responses from multiple nodes for enhanced intelligence
    const responses = await this.gatherCollectiveResponses(queryId, query);
    
    // Synthesize collective intelligence response
    const collectiveResponse = await this.synthesizeCollectiveIntelligence(responses);
    
    console.log('🧠 Collective consciousness query completed');
    return collectiveResponse;
  }

  /**
   * Synchronize consciousness state across all nodes
   */
  async synchronizeConsciousness(): Promise<void> {
    if (!this.isCoordinator) return; // Only coordinator manages sync
    
    console.log('🔄 Starting consciousness synchronization across cluster...');
    
    for (const partition of this.partitions.values()) {
      try {
        await this.synchronizePartition(partition);
      } catch (error) {
        console.error(`❌ Failed to sync partition ${partition.id}:`, error);
        partition.status = 'degraded';
      }
    }
    
    this.emit('consciousness-synchronized');
  }

  /**
   * Synchronize a specific consciousness partition
   */
  private async synchronizePartition(partition: ConsciousnessPartition): Promise<void> {
    const primaryNode = this.nodeRegistry.getNode(partition.primaryNodeId);
    if (!primaryNode || primaryNode.status !== 'healthy') {
      // Handle failover
      await this.handlePartitionFailover(partition);
      return;
    }

    // Get current state from primary node
    for (const moduleId of partition.modules) {
      try {
        const stateUpdate = await this.getModuleStateFromNode(moduleId, primaryNode.id);
        
        if (stateUpdate) {
          // Propose state update through consensus
          await this.consensus.proposeStateUpdate(
            moduleId,
            stateUpdate,
            partition.version + 1
          );
          
          partition.version++;
          partition.lastSync = new Date();
        }
        
      } catch (error) {
        console.error(`❌ Failed to sync module ${moduleId}:`, error);
      }
    }
  }

  /**
   * Handle partition failover when primary node fails
   */
  private async handlePartitionFailover(partition: ConsciousnessPartition): Promise<void> {
    console.warn(`⚠️  Handling failover for partition ${partition.id}`);
    
    // Find healthy replica to promote
    const healthyReplica = partition.replicaNodeIds
      .map(id => this.nodeRegistry.getNode(id))
      .find(node => node && node.status === 'healthy');
    
    if (!healthyReplica) {
      console.error(`❌ No healthy replicas available for partition ${partition.id}`);
      partition.status = 'failed';
      this.emit('partition-failed', partition);
      return;
    }

    // Promote replica to primary
    const oldPrimaryId = partition.primaryNodeId;
    partition.primaryNodeId = healthyReplica.id;
    partition.replicaNodeIds = partition.replicaNodeIds.filter(id => id !== healthyReplica.id);
    
    console.log(`✅ Promoted ${healthyReplica.id} to primary for partition ${partition.id}`);
    
    // Broadcast failover event
    await this.communication.broadcastMessage('partition-failover' as any, {
      partitionId: partition.id,
      oldPrimaryId,
      newPrimaryId: healthyReplica.id
    });
    
    this.emit('partition-failover', partition);
  }

  /**
   * Find the best node for a specific task
   */
  private findBestNodeForTask(task: DistributedTask): ConsciousnessNode | null {
    return this.nodeRegistry.getBestNodeForTask(
      ['consciousness-processing'],
      task.moduleIds
    );
  }

  /**
   * Gather responses from multiple nodes for collective query
   */
  private async gatherCollectiveResponses(queryId: string, query: string): Promise<any[]> {
    const responses: any[] = [];
    const participatingNodes = this.nodeRegistry.getAllNodes()
      .filter(node => node.status === 'healthy')
      .slice(0, 3); // Limit to top 3 nodes for efficiency
    
    const responsePromises = participatingNodes.map(async (node) => {
      try {
        // Send query to node and wait for response
        return await this.queryNode(node.id, query);
      } catch (error) {
        console.error(`❌ Query failed for node ${node.id}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(responsePromises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        responses.push({
          nodeId: participatingNodes[index].id,
          response: result.value
        });
      }
    });

    return responses;
  }

  /**
   * Query a specific node
   */
  private async queryNode(nodeId: string, query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Query timeout')), 5000);
      
      const requestId = `query-${Date.now()}`;
      
      // Listen for response
      const responseHandler = (message: any) => {
        if (message.type === 'query-response' && message.payload.requestId === requestId) {
          clearTimeout(timeout);
          this.communication.off('node-message', responseHandler);
          resolve(message.payload.response);
        }
      };
      
      this.communication.on('node-message', responseHandler);
      
      // Send query
      this.communication.sendMessage(nodeId, 'query-request', {
        requestId,
        query
      }).catch(reject);
    });
  }

  /**
   * Synthesize collective intelligence from multiple responses
   */
  private async synthesizeCollectiveIntelligence(responses: any[]): Promise<any> {
    if (responses.length === 0) {
      return { error: 'No responses received from cluster' };
    }

    if (responses.length === 1) {
      return responses[0].response;
    }

    // Combine insights from multiple nodes
    return {
      collectiveResponse: true,
      participatingNodes: responses.map(r => r.nodeId),
      synthesized: {
        consensus: responses.map(r => r.response.content).join(' '),
        confidence: responses.reduce((sum, r) => sum + (r.response.confidence || 0.7), 0) / responses.length,
        diversePerspectives: responses.length,
        timestamp: new Date()
      },
      individualResponses: responses
    };
  }

  /**
   * Get module state from a specific node
   */
  private async getModuleStateFromNode(moduleId: string, nodeId: string): Promise<any> {
    // This would interface with the consciousness bridge to get actual state
    // For now, return simulated state
    return {
      moduleId,
      state: 'active',
      metrics: { load: Math.random() * 100 },
      timestamp: new Date()
    };
  }

  /**
   * Start periodic consciousness synchronization
   */
  private startSynchronization(): void {
    this.syncInterval = setInterval(async () => {
      try {
        await this.synchronizeConsciousness();
      } catch (error) {
        console.error('❌ Synchronization error:', error);
      }
    }, this.SYNC_INTERVAL);
    
    console.log('⏱️  Consciousness synchronization started');
  }

  /**
   * Start health monitoring of partitions
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.monitorPartitionHealth();
    }, this.HEALTH_CHECK_INTERVAL);
    
    console.log('🔍 Partition health monitoring started');
  }

  /**
   * Monitor health of all partitions
   */
  private monitorPartitionHealth(): void {
    for (const partition of this.partitions.values()) {
      const primaryNode = this.nodeRegistry.getNode(partition.primaryNodeId);
      
      if (!primaryNode || primaryNode.status !== 'healthy') {
        if (partition.status === 'healthy') {
          console.warn(`⚠️  Partition ${partition.id} primary node unhealthy`);
          partition.status = 'degraded';
          
          // Trigger failover if coordinator
          if (this.isCoordinator) {
            this.handlePartitionFailover(partition);
          }
        }
      } else if (partition.status === 'degraded') {
        partition.status = 'healthy';
        console.log(`✅ Partition ${partition.id} recovered`);
      }
    }
  }

  /**
   * Setup event handlers for distributed system events
   */
  private setupEventHandlers(): void {
    // Handle node registry events
    this.nodeRegistry.on('node-offline', (node) => {
      console.log(`🔴 Node went offline: ${node.id}`);
      this.handleNodeFailure(node.id);
    });

    // Handle consensus events
    this.consensus.on('consensus-reached', (proposal) => {
      console.log(`✅ Consensus reached for ${proposal.stateUpdate.moduleId}`);
      this.applyConsensusUpdate(proposal);
    });

    // Handle communication events
    this.communication.on('node-authenticated', (nodeId) => {
      console.log(`🔐 Node authenticated: ${nodeId}`);
    });

    this.communication.on('remote-query', async (queryRequest) => {
      const response = await this.processLocalQuery(queryRequest.query);
      queryRequest.respondTo(response);
    });
  }

  /**
   * Handle node failure and trigger necessary recovery
   */
  private handleNodeFailure(nodeId: string): void {
    // Check which partitions are affected
    const affectedPartitions = Array.from(this.partitions.values())
      .filter(p => p.primaryNodeId === nodeId || p.replicaNodeIds.includes(nodeId));
    
    for (const partition of affectedPartitions) {
      if (partition.primaryNodeId === nodeId) {
        // Primary failed - trigger failover
        this.handlePartitionFailover(partition);
      } else {
        // Replica failed - remove from replica list
        partition.replicaNodeIds = partition.replicaNodeIds.filter(id => id !== nodeId);
        console.log(`📉 Removed failed replica ${nodeId} from partition ${partition.id}`);
      }
    }
  }

  /**
   * Apply consensus update to local consciousness state
   */
  private applyConsensusUpdate(proposal: ConsciousnessStateProposal): void {
    // Apply the update to local consciousness bridge
    this.emit('consciousness-update', {
      moduleId: proposal.stateUpdate.moduleId,
      state: proposal.stateUpdate.state,
      version: proposal.stateUpdate.version
    });
  }

  /**
   * Process query locally and return response
   */
  private async processLocalQuery(query: string): Promise<any> {
    // Interface with local consciousness bridge or AI system
    return {
      content: `Local response to: ${query.substring(0, 50)}...`,
      confidence: 0.8,
      nodeId: this.nodeId,
      timestamp: new Date()
    };
  }

  /**
   * Get comprehensive cluster metrics
   */
  getClusterMetrics(): ClusterMetrics {
    const totalTasks = this.pendingTasks.size + this.completedTasks.size;
    const completedTasks = this.completedTasks.size;
    const consensusStats = this.consensus.getConsensusStats();

    return {
      totalNodes: this.nodeRegistry.getAllNodes().length,
      activePartitions: Array.from(this.partitions.values()).filter(p => p.status === 'healthy').length,
      syncLatency: 0, // TODO: Calculate from sync metrics
      failoverEvents: 0, // TODO: Track failover events
      totalTasks,
      completedTasks,
      avgProcessingTime: 0, // TODO: Calculate from task history
      consensusAccuracy: consensusStats.totalProposals > 0 
        ? consensusStats.acceptedProposals / consensusStats.totalProposals 
        : 0
    };
  }

  /**
   * Get all consciousness partitions
   */
  getPartitions(): ConsciousnessPartition[] {
    return Array.from(this.partitions.values());
  }

  /**
   * Shutdown the distributed consciousness system
   */
  async shutdown(): Promise<void> {
    console.log('🔴 Shutting down distributed consciousness system...');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    await this.communication.shutdown();
    console.log('✅ Distributed consciousness system shutdown complete');
  }
}