import { ConsciousnessModule, SystemMetrics, ActivityEvent, SafetyStatus, KnowledgeGraph, CollaborationMessage, EmergencyAction } from "../shared/schema";

export interface IStorage {
  // Consciousness Modules
  getModules(): Promise<ConsciousnessModule[]>;
  getModule(id: string): Promise<ConsciousnessModule | null>;
  updateModule(id: string, updates: Partial<ConsciousnessModule>): Promise<ConsciousnessModule>;
  
  // System Metrics
  getLatestMetrics(): Promise<SystemMetrics | null>;
  addMetrics(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics>;
  getMetricsHistory(hours: number): Promise<SystemMetrics[]>;
  
  // Activity Feed
  getRecentActivities(limit: number): Promise<ActivityEvent[]>;
  addActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent>;
  
  // Safety Status
  getLatestSafetyStatus(): Promise<SafetyStatus | null>;
  updateSafetyStatus(status: Omit<SafetyStatus, 'id' | 'timestamp'>): Promise<SafetyStatus>;
  
  // Knowledge Graph
  getKnowledgeGraph(): Promise<KnowledgeGraph | null>;
  updateKnowledgeGraph(graph: KnowledgeGraph): Promise<KnowledgeGraph>;
  
  // AI Collaboration
  getCollaborationMessages(limit: number): Promise<CollaborationMessage[]>;
  addCollaborationMessage(message: Omit<CollaborationMessage, 'id' | 'timestamp'>): Promise<CollaborationMessage>;
  
  // Emergency Actions
  executeEmergencyAction(action: Omit<EmergencyAction, 'timestamp'>): Promise<EmergencyAction>;
  getEmergencyHistory(): Promise<EmergencyAction[]>;
}

export class MemStorage implements IStorage {
  private modules: Map<string, ConsciousnessModule> = new Map();
  private metrics: SystemMetrics[] = [];
  private activities: ActivityEvent[] = [];
  private safetyStatus: SafetyStatus[] = [];
  private knowledgeGraph: KnowledgeGraph | null = null;
  private collaborationMessages: CollaborationMessage[] = [];
  private emergencyActions: EmergencyAction[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize consciousness modules
    const defaultModules = [
      {
        id: "global_workspace",
        name: "Global Workspace",
        status: "active" as const,
        integrationLevel: 94,
        load: 67,
        metrics: { "integration": 94, "load": 67 },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "social_cognition",
        name: "Social Cognition",
        status: "active" as const,
        integrationLevel: 89,
        load: 45,
        metrics: { "theoryOfMind": 89, "agentsTracked": 23 },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "temporal_consciousness",
        name: "Temporal Consciousness",
        status: "active" as const,
        integrationLevel: 92,
        load: 58,
        metrics: { "narrativeCoherence": 92, "futureProjections": 156 },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "value_learning",
        name: "Value Learning",
        status: "warning" as const,
        integrationLevel: 87,
        load: 73,
        metrics: { "valuesEvolved": 247, "conflicts": 3 },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "virtue_learning",
        name: "Virtue Learning",
        status: "active" as const,
        integrationLevel: 84,
        load: 52,
        metrics: { "characterScore": 84, "wisdomLevel": "High" },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "creative_intelligence",
        name: "Creative Intelligence",
        status: "active" as const,
        integrationLevel: 91,
        load: 68,
        metrics: { "noveltyScore": 91, "conceptsGenerated": 1247 },
        lastUpdated: new Date().toISOString(),
      }
    ];

    defaultModules.forEach(module => {
      this.modules.set(module.id, module);
    });

    // Initialize system metrics
    this.metrics.push({
      id: "current",
      consciousnessCoherence: 87.3,
      creativeIntelligence: 94.7,
      safetyCompliance: 99.1,
      learningEfficiency: 76.8,
      costPerHour: 147.32,
      modulesOnline: 42,
      totalModules: 42,
      timestamp: new Date().toISOString(),
    });

    // Initialize safety status
    this.safetyStatus.push({
      id: "current",
      ethicalCompliance: 99.1,
      valueAlignment: 87.3,
      safetyConstraints: true,
      quarantineQueueSize: 3,
      timestamp: new Date().toISOString(),
    });

    // Initialize knowledge graph
    this.knowledgeGraph = {
      nodes: [
        {
          id: "central",
          label: "Global Workspace",
          type: "module",
          position: { x: 50, y: 50 },
          connections: ["social", "temporal", "creative", "values"],
          weight: 1.0,
        },
        {
          id: "social",
          label: "Social Cognition",
          type: "module",
          position: { x: 33, y: 20 },
          connections: ["central"],
          weight: 0.8,
        },
        {
          id: "temporal",
          label: "Temporal Consciousness",
          type: "module",
          position: { x: 67, y: 20 },
          connections: ["central"],
          weight: 0.9,
        },
        {
          id: "creative",
          label: "Creative Intelligence",
          type: "module",
          position: { x: 25, y: 80 },
          connections: ["central"],
          weight: 0.95,
        },
        {
          id: "values",
          label: "Value Learning",
          type: "module",
          position: { x: 75, y: 80 },
          connections: ["central"],
          weight: 0.85,
        }
      ],
      totalNodes: 127394,
      totalEdges: 2847192,
      clusters: 42,
    };
  }

  async getModules(): Promise<ConsciousnessModule[]> {
    return Array.from(this.modules.values());
  }

  async getModule(id: string): Promise<ConsciousnessModule | null> {
    return this.modules.get(id) || null;
  }

  async updateModule(id: string, updates: Partial<ConsciousnessModule>): Promise<ConsciousnessModule> {
    const existing = this.modules.get(id);
    if (!existing) {
      throw new Error(`Module ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    
    this.modules.set(id, updated);
    return updated;
  }

  async getLatestMetrics(): Promise<SystemMetrics | null> {
    return this.metrics[this.metrics.length - 1] || null;
  }

  async addMetrics(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics> {
    const newMetrics = {
      ...metrics,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    this.metrics.push(newMetrics);
    
    // Keep only last 1000 entries
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    return newMetrics;
  }

  async getMetricsHistory(hours: number): Promise<SystemMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => new Date(m.timestamp) > cutoff);
  }

  async getRecentActivities(limit: number): Promise<ActivityEvent[]> {
    return this.activities.slice(-limit).reverse();
  }

  async addActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const newActivity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    this.activities.push(newActivity);
    
    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(-1000);
    }
    
    return newActivity;
  }

  async getLatestSafetyStatus(): Promise<SafetyStatus | null> {
    return this.safetyStatus[this.safetyStatus.length - 1] || null;
  }

  async updateSafetyStatus(status: Omit<SafetyStatus, 'id' | 'timestamp'>): Promise<SafetyStatus> {
    const newStatus = {
      ...status,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    this.safetyStatus.push(newStatus);
    
    // Keep only last 100 entries
    if (this.safetyStatus.length > 100) {
      this.safetyStatus = this.safetyStatus.slice(-100);
    }
    
    return newStatus;
  }

  async getKnowledgeGraph(): Promise<KnowledgeGraph | null> {
    return this.knowledgeGraph;
  }

  async updateKnowledgeGraph(graph: KnowledgeGraph): Promise<KnowledgeGraph> {
    this.knowledgeGraph = graph;
    return graph;
  }

  async getCollaborationMessages(limit: number): Promise<CollaborationMessage[]> {
    return this.collaborationMessages.slice(-limit).reverse();
  }

  async addCollaborationMessage(message: Omit<CollaborationMessage, 'id' | 'timestamp'>): Promise<CollaborationMessage> {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    this.collaborationMessages.push(newMessage);
    
    // Keep only last 100 messages
    if (this.collaborationMessages.length > 100) {
      this.collaborationMessages = this.collaborationMessages.slice(-100);
    }
    
    return newMessage;
  }

  async executeEmergencyAction(action: Omit<EmergencyAction, 'timestamp'>): Promise<EmergencyAction> {
    const newAction = {
      ...action,
      timestamp: new Date().toISOString(),
    };
    
    this.emergencyActions.push(newAction);
    return newAction;
  }

  async getEmergencyHistory(): Promise<EmergencyAction[]> {
    return this.emergencyActions.slice(-50); // Last 50 actions
  }
}
