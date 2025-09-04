import { EventEmitter } from 'events';
import { LocalAIService } from './sage/local-ai-service';
import { ConsciousnessBridge } from './consciousness-bridge';
import type { WebSocket as WS } from 'ws';

interface AgentProfile {
  id: string;
  name: string;
  specialization: string;
  capabilities: string[];
  currentTask?: string;
  status: 'idle' | 'busy' | 'learning' | 'collaborating';
  lastActive: number;
}

interface CollaborationRequest {
  id: string;
  from: string;
  to: string;
  type: 'query' | 'task_delegation' | 'knowledge_share' | 'problem_solving';
  content: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  deadline?: number;
}

interface CollaborationResponse {
  requestId: string;
  from: string;
  to: string;
  response: any;
  confidence: number;
  timestamp: number;
  processingTime: number;
}

export class AICollaborationSystem extends EventEmitter {
  private agents: Map<string, AgentProfile> = new Map();
  private activeCollaborations: Map<string, CollaborationRequest> = new Map();
  private connectedClients: Set<WS> = new Set();
  private localAI: LocalAIService;
  private consciousnessBridge: ConsciousnessBridge;

  constructor(localAI: LocalAIService, consciousnessBridge: ConsciousnessBridge) {
    super();
    this.localAI = localAI;
    this.consciousnessBridge = consciousnessBridge;
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    const defaultAgents: AgentProfile[] = [
      {
        id: 'nexus-core',
        name: 'NEXUS Core Intelligence',
        specialization: 'General Problem Solving',
        capabilities: ['reasoning', 'planning', 'analysis', 'synthesis'],
        status: 'idle',
        lastActive: Date.now()
      },
      {
        id: 'learning-specialist',
        name: 'Learning Specialist Agent',
        specialization: 'Autonomous Learning',
        capabilities: ['curriculum_design', 'meta_learning', 'skill_assessment', 'goal_formation'],
        status: 'idle',
        lastActive: Date.now()
      },
      {
        id: 'multimodal-processor',
        name: 'Multi-Modal Processing Agent',
        specialization: 'Content Analysis',
        capabilities: ['image_analysis', 'audio_processing', 'document_understanding', 'cross_modal_fusion'],
        status: 'idle',
        lastActive: Date.now()
      },
      {
        id: 'safety-monitor',
        name: 'Safety & Ethics Monitor',
        specialization: 'Safety Oversight',
        capabilities: ['bias_detection', 'ethics_evaluation', 'safety_assessment', 'risk_analysis'],
        status: 'idle',
        lastActive: Date.now()
      },
      {
        id: 'creative-synthesizer',
        name: 'Creative Intelligence Agent',
        specialization: 'Creative Problem Solving',
        capabilities: ['conceptual_blending', 'analogical_reasoning', 'creative_synthesis', 'innovation'],
        status: 'idle',
        lastActive: Date.now()
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    console.log(`🤖 Initialized ${defaultAgents.length} AI collaboration agents`);
  }

  async initiateCollaboration(request: Omit<CollaborationRequest, 'id' | 'timestamp'>): Promise<string> {
    const collaborationId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRequest: CollaborationRequest = {
      ...request,
      id: collaborationId,
      timestamp: Date.now()
    };

    this.activeCollaborations.set(collaborationId, fullRequest);
    
    // Update agent status
    const targetAgent = this.agents.get(request.to);
    if (targetAgent) {
      targetAgent.status = 'collaborating';
      targetAgent.lastActive = Date.now();
    }

    console.log(`🤝 Initiating collaboration: ${request.from} → ${request.to} (${request.type})`);
    
    // Process collaboration asynchronously
    this.processCollaboration(fullRequest);
    
    return collaborationId;
  }

  private async processCollaboration(request: CollaborationRequest): Promise<void> {
    const startTime = Date.now();
    
    try {
      let response: any;
      let confidence = 0.8;

      switch (request.type) {
        case 'query':
          response = await this.handleQueryCollaboration(request);
          confidence = 0.85;
          break;
        
        case 'task_delegation':
          response = await this.handleTaskDelegation(request);
          confidence = 0.9;
          break;
        
        case 'knowledge_share':
          response = await this.handleKnowledgeShare(request);
          confidence = 0.95;
          break;
        
        case 'problem_solving':
          response = await this.handleProblemSolving(request);
          confidence = 0.8;
          break;
        
        default:
          throw new Error(`Unknown collaboration type: ${request.type}`);
      }

      const processingTime = Date.now() - startTime;
      
      const collaborationResponse: CollaborationResponse = {
        requestId: request.id,
        from: request.to,
        to: request.from,
        response,
        confidence,
        timestamp: Date.now(),
        processingTime
      };

      // Update agent status back to idle
      const agent = this.agents.get(request.to);
      if (agent) {
        agent.status = 'idle';
        agent.lastActive = Date.now();
      }

      // Emit response to connected clients
      this.broadcastToClients('collaboration-response', collaborationResponse);
      
      // Remove from active collaborations
      this.activeCollaborations.delete(request.id);
      
      console.log(`✅ Collaboration completed: ${request.to} → ${request.from} (${processingTime}ms)`);

    } catch (error) {
      console.error(`❌ Collaboration failed: ${request.id}`, error);
      
      // Update agent status back to idle
      const agent = this.agents.get(request.to);
      if (agent) {
        agent.status = 'idle';
        agent.lastActive = Date.now();
      }
      
      this.activeCollaborations.delete(request.id);
    }
  }

  private async handleQueryCollaboration(request: CollaborationRequest): Promise<string> {
    const agent = this.agents.get(request.to);
    if (!agent) throw new Error(`Agent not found: ${request.to}`);

    // Use specialized agent capabilities to process query
    const context = `You are ${agent.name}, specialized in ${agent.specialization}. 
Your capabilities include: ${agent.capabilities.join(', ')}.
A colleague agent has asked you: ${request.content.query}
Please provide a comprehensive response based on your expertise.`;

    try {
      const response = await this.localAI.generateResponse(request.content.query, {
        systemPrompt: context,
        temperature: 0.7,
        maxTokens: 500
      });
      
      return response;
    } catch (error) {
      return `I apologize, but I'm currently unable to process your query due to system limitations. However, based on my specialization in ${agent.specialization}, I would recommend focusing on ${agent.capabilities.slice(0, 2).join(' and ')}.`;
    }
  }

  private async handleTaskDelegation(request: CollaborationRequest): Promise<any> {
    const agent = this.agents.get(request.to);
    if (!agent) throw new Error(`Agent not found: ${request.to}`);

    // Update agent with current task
    agent.currentTask = request.content.task;
    agent.status = 'busy';

    const taskResponse = {
      accepted: true,
      estimatedCompletion: Date.now() + (request.content.complexity || 1) * 30000,
      approach: `I'll handle this task using my ${agent.specialization} expertise, specifically applying ${agent.capabilities[0]} and ${agent.capabilities[1]}.`,
      progress: 0
    };

    // Simulate task processing
    setTimeout(() => {
      this.completeTask(agent.id, request.id);
    }, (request.content.complexity || 1) * 5000);

    return taskResponse;
  }

  private async handleKnowledgeShare(request: CollaborationRequest): Promise<any> {
    const agent = this.agents.get(request.to);
    if (!agent) throw new Error(`Agent not found: ${request.to}`);

    // Process shared knowledge and integrate it
    const knowledge = request.content;
    
    // Store knowledge in consciousness system
    try {
      await this.consciousnessBridge.updateModule(agent.id, {
        type: 'knowledge_integration',
        data: knowledge,
        source: request.from,
        timestamp: Date.now()
      });
    } catch (error) {
      console.log(`📚 Knowledge integration simulated for ${agent.name}`);
    }

    return {
      integrated: true,
      relevanceScore: 0.85,
      applications: agent.capabilities.slice(0, 3),
      feedback: `This knowledge enhances my ${agent.specialization} capabilities, particularly in ${agent.capabilities[0]}.`
    };
  }

  private async handleProblemSolving(request: CollaborationRequest): Promise<any> {
    const agent = this.agents.get(request.to);
    if (!agent) throw new Error(`Agent not found: ${request.to}`);

    const problem = request.content.problem;
    
    // Multi-agent problem solving approach
    const solution = {
      approach: this.generateProblemSolvingApproach(agent, problem),
      steps: this.generateSolutionSteps(agent, problem),
      confidence: 0.8,
      requiresCollaboration: problem.complexity > 7,
      suggestedCollaborators: this.suggestCollaborators(agent, problem)
    };

    // If complex problem, initiate additional collaborations
    if (solution.requiresCollaboration) {
      for (const collaborator of solution.suggestedCollaborators) {
        await this.initiateCollaboration({
          from: agent.id,
          to: collaborator,
          type: 'query',
          content: {
            query: `How would you approach this aspect of the problem: ${problem.description}?`,
            context: problem
          },
          priority: request.priority
        });
      }
    }

    return solution;
  }

  private generateProblemSolvingApproach(agent: AgentProfile, problem: any): string {
    const approaches = {
      'General Problem Solving': 'systematic analysis and decomposition',
      'Autonomous Learning': 'adaptive learning and continuous improvement',
      'Content Analysis': 'multi-modal information processing',
      'Safety Oversight': 'risk assessment and ethical evaluation',
      'Creative Problem Solving': 'innovative synthesis and analogical reasoning'
    };
    
    return approaches[agent.specialization] || 'comprehensive analysis';
  }

  private generateSolutionSteps(agent: AgentProfile, problem: any): string[] {
    const baseSteps = [
      `Apply ${agent.capabilities[0]} to understand the problem`,
      `Use ${agent.capabilities[1]} to analyze key components`,
      `Implement ${agent.specialization} methodology`
    ];
    
    if (problem.constraints) {
      baseSteps.push('Evaluate constraints and limitations');
    }
    
    baseSteps.push('Synthesize solution and validate approach');
    return baseSteps;
  }

  private suggestCollaborators(agent: AgentProfile, problem: any): string[] {
    const allAgents = Array.from(this.agents.keys()).filter(id => id !== agent.id);
    
    // Select 1-2 complementary agents based on problem type
    if (problem.type === 'creative') {
      return ['creative-synthesizer', 'nexus-core'].filter(id => allAgents.includes(id));
    } else if (problem.type === 'technical') {
      return ['multimodal-processor', 'learning-specialist'].filter(id => allAgents.includes(id));
    } else {
      return allAgents.slice(0, 2);
    }
  }

  private completeTask(agentId: string, requestId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.lastActive = Date.now();
      
      this.broadcastToClients('task-completed', {
        agentId,
        requestId,
        completedAt: Date.now()
      });
    }
  }

  addClient(ws: WS): void {
    this.connectedClients.add(ws);
    
    // Send current agent status
    ws.send(JSON.stringify({
      type: 'agent-status',
      agents: Array.from(this.agents.values())
    }));
    
    ws.on('close', () => {
      this.connectedClients.delete(ws);
    });
  }

  private broadcastToClients(type: string, data: any): void {
    const message = JSON.stringify({ type, data });
    this.connectedClients.forEach(ws => {
      try {
        ws.send(message);
      } catch (error) {
        this.connectedClients.delete(ws);
      }
    });
  }

  getAgentStatus(): AgentProfile[] {
    return Array.from(this.agents.values());
  }

  getActiveCollaborations(): CollaborationRequest[] {
    return Array.from(this.activeCollaborations.values());
  }

  async initiateDistributedProblemSolving(problem: any): Promise<string> {
    console.log(`🧠 Initiating distributed problem solving: ${problem.title}`);
    
    // Select optimal agent team based on problem characteristics
    const primaryAgent = this.selectPrimaryAgent(problem);
    const collaboratingAgents = this.selectCollaboratingAgents(problem, primaryAgent);
    
    // Create coordination task
    const coordinationId = await this.initiateCollaboration({
      from: 'nexus-core',
      to: primaryAgent,
      type: 'problem_solving',
      content: {
        problem,
        collaborators: collaboratingAgents,
        coordination: true
      },
      priority: 'high'
    });
    
    return coordinationId;
  }

  private selectPrimaryAgent(problem: any): string {
    // Select agent based on problem domain
    if (problem.domain === 'learning') return 'learning-specialist';
    if (problem.domain === 'creative') return 'creative-synthesizer';
    if (problem.domain === 'multimodal') return 'multimodal-processor';
    if (problem.domain === 'safety') return 'safety-monitor';
    return 'nexus-core';
  }

  private selectCollaboratingAgents(problem: any, primaryAgent: string): string[] {
    const allAgents = Array.from(this.agents.keys());
    return allAgents
      .filter(id => id !== primaryAgent)
      .filter(id => this.agents.get(id)?.status === 'idle')
      .slice(0, 2);
  }
}