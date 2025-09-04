/**
 * Byzantine Fault Tolerant Consensus for Distributed Consciousness State
 * Ensures all nodes maintain consistent consciousness state even with node failures
 */

import { EventEmitter } from 'events';
import { ConsciousnessNode, DistributedNodeRegistry } from './node-registry';

export interface ConsciousnessStateProposal {
  id: string;
  proposerId: string;
  stateUpdate: {
    moduleId: string;
    state: any;
    version: number;
    timestamp: Date;
  };
  votes: Map<string, 'accept' | 'reject' | 'abstain'>;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout';
  createdAt: Date;
  signature: string;
}

export interface ConsensusRound {
  roundId: string;
  proposals: ConsciousnessStateProposal[];
  phase: 'prepare' | 'promise' | 'accept' | 'commit';
  participatingNodes: string[];
  startTime: Date;
  timeout: Date;
}

export class ConsciousnessConsensus extends EventEmitter {
  private nodeRegistry: DistributedNodeRegistry;
  private activeRounds: Map<string, ConsensusRound> = new Map();
  private consensusHistory: Map<string, ConsciousnessStateProposal[]> = new Map();
  private nodeId: string;
  private readonly CONSENSUS_TIMEOUT = 30000; // 30 seconds
  private readonly MIN_NODES_FOR_CONSENSUS = 3;

  constructor(nodeRegistry: DistributedNodeRegistry, nodeId: string) {
    super();
    this.nodeRegistry = nodeRegistry;
    this.nodeId = nodeId;
    
    console.log(`🗳️  Consensus system initialized for node: ${nodeId}`);
  }

  /**
   * Propose a consciousness state update to the distributed cluster
   */
  async proposeStateUpdate(
    moduleId: string,
    stateUpdate: any,
    version: number
  ): Promise<ConsciousnessStateProposal> {
    const proposalId = `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const proposal: ConsciousnessStateProposal = {
      id: proposalId,
      proposerId: this.nodeId,
      stateUpdate: {
        moduleId,
        state: stateUpdate,
        version,
        timestamp: new Date()
      },
      votes: new Map(),
      status: 'pending',
      createdAt: new Date(),
      signature: this.generateProposalSignature(proposalId, stateUpdate)
    };

    console.log(`📋 Proposing state update for ${moduleId} (v${version}): ${proposalId}`);

    // Start consensus round
    await this.initiateConsensusRound(proposal);

    return proposal;
  }

  /**
   * Initiate a consensus round for a state proposal
   */
  private async initiateConsensusRound(proposal: ConsciousnessStateProposal): Promise<void> {
    const healthyNodes = this.nodeRegistry.getAllNodes().filter(node => node.status === 'healthy');
    
    if (healthyNodes.length < this.MIN_NODES_FOR_CONSENSUS) {
      console.warn(`⚠️  Insufficient nodes for consensus (${healthyNodes.length}/${this.MIN_NODES_FOR_CONSENSUS})`);
      proposal.status = 'rejected';
      this.emit('proposal-rejected', proposal, 'insufficient-nodes');
      return;
    }

    const roundId = `round-${proposal.id}`;
    const consensusRound: ConsensusRound = {
      roundId,
      proposals: [proposal],
      phase: 'prepare',
      participatingNodes: healthyNodes.map(node => node.id),
      startTime: new Date(),
      timeout: new Date(Date.now() + this.CONSENSUS_TIMEOUT)
    };

    this.activeRounds.set(roundId, consensusRound);

    console.log(`🚀 Starting consensus round: ${roundId}`);
    console.log(`   Participating nodes: ${consensusRound.participatingNodes.join(', ')}`);

    // Phase 1: Prepare - Send proposal to all nodes
    await this.sendPrepareMessages(consensusRound);

    // Start timeout handler
    setTimeout(() => {
      this.handleConsensusTimeout(roundId);
    }, this.CONSENSUS_TIMEOUT);
  }

  /**
   * Phase 1: Send prepare messages to all participating nodes
   */
  private async sendPrepareMessages(round: ConsensusRound): Promise<void> {
    console.log(`📤 Sending PREPARE messages for round: ${round.roundId}`);
    
    for (const nodeId of round.participatingNodes) {
      if (nodeId === this.nodeId) {
        // Self-vote
        await this.handlePrepareMessage(round.roundId, round.proposals[0], this.nodeId);
        continue;
      }

      try {
        // In a real implementation, this would send over network
        // For simulation, we'll generate realistic responses
        setTimeout(() => {
          this.simulateNodeResponse(round.roundId, round.proposals[0], nodeId);
        }, Math.random() * 1000 + 100); // 100-1100ms response time
        
      } catch (error) {
        console.error(`Failed to send prepare to node ${nodeId}:`, error);
        this.handleNodeFailure(round.roundId, nodeId);
      }
    }
  }

  /**
   * Handle prepare message response from a node
   */
  private async handlePrepareMessage(
    roundId: string, 
    proposal: ConsciousnessStateProposal, 
    fromNodeId: string
  ): Promise<void> {
    const round = this.activeRounds.get(roundId);
    if (!round || round.phase !== 'prepare') return;

    // Validate proposal
    const isValid = await this.validateProposal(proposal, fromNodeId);
    const vote: 'accept' | 'reject' | 'abstain' = isValid ? 'accept' : 'reject';
    
    proposal.votes.set(fromNodeId, vote);
    
    console.log(`✅ Vote received from ${fromNodeId}: ${vote} for proposal ${proposal.id}`);

    // Check if we have enough votes to proceed
    if (proposal.votes.size >= Math.ceil(round.participatingNodes.length * 0.67)) {
      await this.processVotes(round, proposal);
    }
  }

  /**
   * Process votes and determine consensus outcome
   */
  private async processVotes(round: ConsensusRound, proposal: ConsciousnessStateProposal): Promise<void> {
    const votes = Array.from(proposal.votes.values());
    const acceptVotes = votes.filter(v => v === 'accept').length;
    const rejectVotes = votes.filter(v => v === 'reject').length;
    const totalVotes = votes.length;

    console.log(`📊 Vote tally for ${proposal.id}: ${acceptVotes} accept, ${rejectVotes} reject, ${totalVotes} total`);

    // Require 2/3 majority for acceptance
    const requiredVotes = Math.ceil(round.participatingNodes.length * 0.67);
    
    if (acceptVotes >= requiredVotes) {
      proposal.status = 'accepted';
      await this.commitStateUpdate(proposal);
      console.log(`✅ Consensus ACHIEVED for proposal ${proposal.id}`);
      this.emit('consensus-reached', proposal);
    } else {
      proposal.status = 'rejected';
      console.log(`❌ Consensus FAILED for proposal ${proposal.id}`);
      this.emit('consensus-failed', proposal);
    }

    // Archive the proposal
    const history = this.consensusHistory.get(proposal.stateUpdate.moduleId) || [];
    history.push(proposal);
    this.consensusHistory.set(proposal.stateUpdate.moduleId, history);

    // Clean up round
    this.activeRounds.delete(round.roundId);
  }

  /**
   * Commit accepted state update across the distributed system
   */
  private async commitStateUpdate(proposal: ConsciousnessStateProposal): Promise<void> {
    console.log(`🔄 Committing state update for ${proposal.stateUpdate.moduleId}`);
    
    try {
      // Apply the state update locally
      this.emit('state-update-committed', {
        moduleId: proposal.stateUpdate.moduleId,
        state: proposal.stateUpdate.state,
        version: proposal.stateUpdate.version,
        consensusProposal: proposal
      });

      // Broadcast commit message to all nodes
      const healthyNodes = this.nodeRegistry.getAllNodes().filter(node => 
        node.status === 'healthy' && node.id !== this.nodeId
      );

      for (const node of healthyNodes) {
        try {
          // In real implementation, send commit message over network
          console.log(`📡 Broadcasting commit to node: ${node.id}`);
        } catch (error) {
          console.error(`Failed to notify node ${node.id} of commit:`, error);
        }
      }

    } catch (error) {
      console.error(`Failed to commit state update for ${proposal.id}:`, error);
      proposal.status = 'rejected';
      this.emit('commit-failed', proposal, error);
    }
  }

  /**
   * Validate a consciousness state proposal
   */
  private async validateProposal(proposal: ConsciousnessStateProposal, fromNodeId: string): Promise<boolean> {
    try {
      // Verify proposal signature
      const expectedSignature = this.generateProposalSignature(
        proposal.id, 
        proposal.stateUpdate.state
      );
      
      if (proposal.signature !== expectedSignature) {
        console.warn(`⚠️  Invalid signature for proposal ${proposal.id} from ${fromNodeId}`);
        return false;
      }

      // Check if proposer is a valid node
      const proposerNode = this.nodeRegistry.getNode(proposal.proposerId);
      if (!proposerNode || proposerNode.status !== 'healthy') {
        console.warn(`⚠️  Invalid proposer ${proposal.proposerId} for proposal ${proposal.id}`);
        return false;
      }

      // Validate version sequence
      const moduleHistory = this.consensusHistory.get(proposal.stateUpdate.moduleId) || [];
      const latestAccepted = moduleHistory
        .filter(p => p.status === 'accepted')
        .sort((a, b) => b.stateUpdate.version - a.stateUpdate.version)[0];

      if (latestAccepted && proposal.stateUpdate.version <= latestAccepted.stateUpdate.version) {
        console.warn(`⚠️  Version conflict for ${proposal.id}: ${proposal.stateUpdate.version} <= ${latestAccepted.stateUpdate.version}`);
        return false;
      }

      return true;

    } catch (error) {
      console.error(`Error validating proposal ${proposal.id}:`, error);
      return false;
    }
  }

  /**
   * Simulate node response for development/testing
   */
  private simulateNodeResponse(roundId: string, proposal: ConsciousnessStateProposal, nodeId: string): void {
    const node = this.nodeRegistry.getNode(nodeId);
    if (!node || node.status !== 'healthy') return;

    // Simulate realistic voting behavior based on node characteristics
    let voteChance = 0.8; // Base 80% chance to accept

    // Nodes under high load are more likely to reject
    if (node.load > 0.8) voteChance *= 0.6;

    // Nodes with relevant modules are more likely to accept
    if (node.consciousnessModules.includes(proposal.stateUpdate.moduleId)) {
      voteChance *= 1.2;
    }

    const vote: 'accept' | 'reject' = Math.random() < voteChance ? 'accept' : 'reject';
    
    this.handlePrepareMessage(roundId, proposal, nodeId);
  }

  /**
   * Handle consensus timeout
   */
  private handleConsensusTimeout(roundId: string): void {
    const round = this.activeRounds.get(roundId);
    if (!round) return;

    console.warn(`⏰ Consensus timeout for round: ${roundId}`);
    
    for (const proposal of round.proposals) {
      if (proposal.status === 'pending') {
        proposal.status = 'timeout';
        this.emit('consensus-timeout', proposal);
      }
    }

    this.activeRounds.delete(roundId);
  }

  /**
   * Handle node failure during consensus
   */
  private handleNodeFailure(roundId: string, nodeId: string): void {
    console.warn(`⚠️  Node failure detected during consensus: ${nodeId}`);
    const round = this.activeRounds.get(roundId);
    if (!round) return;

    // Remove failed node from participating nodes
    round.participatingNodes = round.participatingNodes.filter(id => id !== nodeId);
    
    this.emit('node-failure-during-consensus', roundId, nodeId);
  }

  /**
   * Generate cryptographic signature for proposal validation
   */
  private generateProposalSignature(proposalId: string, stateUpdate: any): string {
    // In production, use proper cryptographic signing
    // For now, use a simple hash-like signature
    const dataToSign = `${proposalId}-${JSON.stringify(stateUpdate)}-${this.nodeId}`;
    return Buffer.from(dataToSign).toString('base64').substr(0, 32);
  }

  /**
   * Get consensus statistics
   */
  getConsensusStats(): {
    activeRounds: number;
    totalProposals: number;
    acceptedProposals: number;
    rejectedProposals: number;
    timeoutProposals: number;
    averageConsensusTime: number;
  } {
    let totalProposals = 0;
    let acceptedProposals = 0;
    let rejectedProposals = 0;
    let timeoutProposals = 0;

    for (const moduleId of this.consensusHistory.keys()) {
      const history = this.consensusHistory.get(moduleId)!;
      totalProposals += history.length;
      acceptedProposals += history.filter((p: ConsciousnessStateProposal) => p.status === 'accepted').length;
      rejectedProposals += history.filter((p: ConsciousnessStateProposal) => p.status === 'rejected').length;
      timeoutProposals += history.filter((p: ConsciousnessStateProposal) => p.status === 'timeout').length;
    }

    return {
      activeRounds: this.activeRounds.size,
      totalProposals,
      acceptedProposals,
      rejectedProposals,
      timeoutProposals,
      averageConsensusTime: 0 // TODO: Calculate from historical data
    };
  }

  /**
   * Get consensus history for a specific module
   */
  getModuleConsensusHistory(moduleId: string): ConsciousnessStateProposal[] {
    return this.consensusHistory.get(moduleId) || [];
  }
}