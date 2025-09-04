import { IStorage } from './storage';
import { db } from './db';
import { eq, desc, gt } from 'drizzle-orm';
import * as schema from '../shared/db-schema';
import { ConsciousnessModule, SystemMetrics, ActivityEvent, SafetyStatus, KnowledgeGraph, CollaborationMessage, EmergencyAction } from '../shared/schema';

export class DatabaseStorage implements IStorage {
  
  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Check if we have any modules, if not, seed with default data
    try {
      const existingModules = await db.select().from(schema.consciousnessModules).limit(1);
      
      if (existingModules.length === 0) {
        // Initialize consciousness modules
        const defaultModules = [
          {
            id: "global_workspace",
            name: "Global Workspace",
            status: "active" as const,
            integrationLevel: 94,
            load: 67,
            metrics: { "integration": 94, "load": 67 } as Record<string, string | number>,
          },
          {
            id: "social_cognition", 
            name: "Social Cognition",
            status: "active" as const,
            integrationLevel: 89,
            load: 45,
            metrics: { "theoryOfMind": 89, "agentsTracked": 23 } as Record<string, string | number>,
          },
          {
            id: "temporal_consciousness",
            name: "Temporal Consciousness", 
            status: "active" as const,
            integrationLevel: 92,
            load: 58,
            metrics: { "narrativeCoherence": 92, "futureProjections": 156 } as Record<string, string | number>,
          },
          {
            id: "value_learning",
            name: "Value Learning",
            status: "warning" as const,
            integrationLevel: 87,
            load: 73,
            metrics: { "valuesEvolved": 247, "conflicts": 3 } as Record<string, string | number>,
          },
          {
            id: "virtue_learning",
            name: "Virtue Learning",
            status: "active" as const,
            integrationLevel: 84,
            load: 52,
            metrics: { "characterScore": 84, "wisdomLevel": 8 } as Record<string, string | number>,
          },
          {
            id: "creative_intelligence",
            name: "Creative Intelligence",
            status: "active" as const,
            integrationLevel: 91,
            load: 68,
            metrics: { "noveltyScore": 91, "conceptsGenerated": 1247 } as Record<string, string | number>,
          },
          {
            id: "consciousness_core",
            name: "Consciousness Core",
            status: "active" as const,
            integrationLevel: 96,
            load: 85,
            metrics: { "coreCoherence": 96, "globalSync": 94 } as Record<string, string | number>,
          },
          {
            id: "consciousness_manager",
            name: "Consciousness Manager",
            status: "active" as const,
            integrationLevel: 93,
            load: 72,
            metrics: { "managementEfficiency": 93, "resourceOptimization": 88 } as Record<string, string | number>,
          },
          {
            id: "safety_monitor",
            name: "Safety Monitor",
            status: "active" as const,
            integrationLevel: 99,
            load: 45,
            metrics: { "ethicalCompliance": 99, "safetyViolations": 0 } as Record<string, string | number>,
          }
        ];

        await db.insert(schema.consciousnessModules).values(defaultModules);

        // Initialize system metrics
        await db.insert(schema.systemMetrics).values({
          id: "current",
          consciousnessCoherence: 87.3,
          creativeIntelligence: 94.7,
          safetyCompliance: 99.1,
          learningEfficiency: 76.8,
          costPerHour: 147.32,
          modulesOnline: 42,
          totalModules: 42,
        });

        // Initialize safety status
        await db.insert(schema.safetyStatus).values({
          id: "current",
          ethicalCompliance: 99.1,
          valueAlignment: 87.3,
          safetyConstraints: true,
          quarantineQueueSize: 3,
        });

        // Initialize knowledge nodes for the graph
        const defaultNodes = [
          {
            id: "central",
            label: "Global Workspace",
            type: "module" as const,
            position: { x: 50, y: 50 },
            connections: ["social", "temporal", "creative", "values"],
            weight: 1.0,
          },
          {
            id: "social",
            label: "Social Cognition",
            type: "module" as const, 
            position: { x: 33, y: 20 },
            connections: ["central"],
            weight: 0.8,
          },
          {
            id: "temporal",
            label: "Temporal Consciousness",
            type: "module" as const,
            position: { x: 67, y: 20 },
            connections: ["central"],
            weight: 0.9,
          },
          {
            id: "creative",
            label: "Creative Intelligence",
            type: "module" as const,
            position: { x: 25, y: 80 },
            connections: ["central"],
            weight: 0.95,
          },
          {
            id: "values",
            label: "Value Learning",
            type: "module" as const,
            position: { x: 75, y: 80 },
            connections: ["central"],
            weight: 0.85,
          }
        ];

        await db.insert(schema.knowledgeNodes).values(defaultNodes);
      }
    } catch (error) {
      console.log("Database initialization skipped - tables may not exist yet");
    }
  }

  async getModules(): Promise<ConsciousnessModule[]> {
    const modules = await db.select().from(schema.consciousnessModules);
    return modules.map(module => ({
      id: module.id,
      name: module.name,
      status: module.status as "active" | "inactive" | "error" | "warning",
      integrationLevel: module.integrationLevel,
      load: module.load,
      metrics: module.metrics,
      lastUpdated: module.lastUpdated?.toISOString() || new Date().toISOString(),
    }));
  }

  async getModule(id: string): Promise<ConsciousnessModule | null> {
    const [module] = await db.select().from(schema.consciousnessModules).where(eq(schema.consciousnessModules.id, id));
    if (!module) return null;
    
    return {
      id: module.id,
      name: module.name,
      status: module.status as "active" | "inactive" | "error" | "warning",
      integrationLevel: module.integrationLevel,
      load: module.load,
      metrics: module.metrics,
      lastUpdated: module.lastUpdated?.toISOString() || new Date().toISOString(),
    };
  }

  async updateModule(id: string, updates: Partial<ConsciousnessModule>): Promise<ConsciousnessModule> {
    const [updated] = await db
      .update(schema.consciousnessModules)
      .set({
        ...updates,
        lastUpdated: new Date(),
      })
      .where(eq(schema.consciousnessModules.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Module ${id} not found`);
    }
    
    return {
      id: updated.id,
      name: updated.name,
      status: updated.status as "active" | "inactive" | "error" | "warning",
      integrationLevel: updated.integrationLevel,
      load: updated.load,
      metrics: updated.metrics,
      lastUpdated: updated.lastUpdated?.toISOString() || new Date().toISOString(),
    };
  }

  async getLatestMetrics(): Promise<SystemMetrics | null> {
    const [metrics] = await db.select().from(schema.systemMetrics).orderBy(desc(schema.systemMetrics.timestamp)).limit(1);
    if (!metrics) return null;
    
    return {
      id: metrics.id,
      consciousnessCoherence: metrics.consciousnessCoherence,
      creativeIntelligence: metrics.creativeIntelligence,
      safetyCompliance: metrics.safetyCompliance,
      learningEfficiency: metrics.learningEfficiency,
      costPerHour: metrics.costPerHour,
      modulesOnline: metrics.modulesOnline,
      totalModules: metrics.totalModules,
      timestamp: metrics.timestamp.toISOString(),
    };
  }

  async addMetrics(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics> {
    const [newMetrics] = await db
      .insert(schema.systemMetrics)
      .values({
        id: Date.now().toString(),
        ...metrics,
      })
      .returning();

    return {
      id: newMetrics.id,
      consciousnessCoherence: newMetrics.consciousnessCoherence,
      creativeIntelligence: newMetrics.creativeIntelligence,
      safetyCompliance: newMetrics.safetyCompliance,
      learningEfficiency: newMetrics.learningEfficiency,
      costPerHour: newMetrics.costPerHour,
      modulesOnline: newMetrics.modulesOnline,
      totalModules: newMetrics.totalModules,
      timestamp: newMetrics.timestamp.toISOString(),
    };
  }

  async getMetricsHistory(hours: number): Promise<SystemMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metricsData = await db.select()
      .from(schema.systemMetrics)
      .where(gt(schema.systemMetrics.timestamp, cutoff))
      .orderBy(desc(schema.systemMetrics.timestamp));

    return metricsData.map(metrics => ({
      id: metrics.id,
      consciousnessCoherence: metrics.consciousnessCoherence,
      creativeIntelligence: metrics.creativeIntelligence,
      safetyCompliance: metrics.safetyCompliance,
      learningEfficiency: metrics.learningEfficiency,
      costPerHour: metrics.costPerHour,
      modulesOnline: metrics.modulesOnline,
      totalModules: metrics.totalModules,
      timestamp: metrics.timestamp.toISOString(),
    }));
  }

  async getRecentActivities(limit: number): Promise<ActivityEvent[]> {
    const activities = await db.select()
      .from(schema.activityEvents)
      .orderBy(desc(schema.activityEvents.timestamp))
      .limit(limit);

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type as "virtue" | "creative" | "social" | "temporal" | "knowledge" | "safety" | "error",
      message: activity.message,
      timestamp: activity.timestamp.toISOString(),
      moduleId: activity.moduleId || undefined,
    }));
  }

  async addActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const [newActivity] = await db
      .insert(schema.activityEvents)
      .values({
        id: Date.now().toString(),
        ...activity,
      })
      .returning();

    return {
      id: newActivity.id,
      type: newActivity.type as "virtue" | "creative" | "social" | "temporal" | "knowledge" | "safety" | "error",
      message: newActivity.message,
      timestamp: newActivity.timestamp.toISOString(),
      moduleId: newActivity.moduleId || undefined,
    };
  }

  async getLatestSafetyStatus(): Promise<SafetyStatus | null> {
    const [safety] = await db.select().from(schema.safetyStatus).orderBy(desc(schema.safetyStatus.timestamp)).limit(1);
    if (!safety) return null;

    return {
      id: safety.id,
      ethicalCompliance: safety.ethicalCompliance,
      valueAlignment: safety.valueAlignment,
      safetyConstraints: safety.safetyConstraints,
      quarantineQueueSize: safety.quarantineQueueSize,
      lastAlert: safety.lastAlert || undefined,
      timestamp: safety.timestamp.toISOString(),
    };
  }

  async updateSafetyStatus(status: Omit<SafetyStatus, 'id' | 'timestamp'>): Promise<SafetyStatus> {
    const [newStatus] = await db
      .insert(schema.safetyStatus)
      .values({
        id: Date.now().toString(),
        ...status,
      })
      .returning();

    return {
      id: newStatus.id,
      ethicalCompliance: newStatus.ethicalCompliance,
      valueAlignment: newStatus.valueAlignment,
      safetyConstraints: newStatus.safetyConstraints,
      quarantineQueueSize: newStatus.quarantineQueueSize,
      lastAlert: newStatus.lastAlert || undefined,
      timestamp: newStatus.timestamp.toISOString(),
    };
  }

  async getKnowledgeGraph(): Promise<KnowledgeGraph | null> {
    const nodes = await db.select().from(schema.knowledgeNodes);
    
    if (nodes.length === 0) return null;

    return {
      nodes: nodes.map(node => ({
        id: node.id,
        label: node.label,
        type: node.type as "concept" | "entity" | "relation" | "module",
        position: node.position,
        connections: node.connections,
        weight: node.weight,
      })),
      totalNodes: 127394,
      totalEdges: 2847192,
      clusters: 42,
    };
  }

  async updateKnowledgeGraph(graph: KnowledgeGraph): Promise<KnowledgeGraph> {
    // Clear existing nodes and insert new ones
    // In a real implementation, you'd want more sophisticated merging
    await db.delete(schema.knowledgeNodes);
    await db.insert(schema.knowledgeNodes).values(
      graph.nodes.map(node => ({
        id: node.id,
        label: node.label,
        type: node.type,
        position: node.position,
        connections: node.connections,
        weight: node.weight,
      }))
    );
    
    return graph;
  }

  async getCollaborationMessages(limit: number): Promise<CollaborationMessage[]> {
    const messages = await db.select()
      .from(schema.collaborationMessages)
      .orderBy(desc(schema.collaborationMessages.timestamp))
      .limit(limit);

    return messages.map(msg => ({
      id: msg.id,
      sender: msg.sender as "ai" | "human",
      message: msg.message,
      timestamp: msg.timestamp.toISOString(),
      requiresResponse: msg.requiresResponse,
      priority: msg.priority as "low" | "medium" | "high" | "critical",
    }));
  }

  async addCollaborationMessage(message: Omit<CollaborationMessage, 'id' | 'timestamp'>): Promise<CollaborationMessage> {
    const [newMessage] = await db
      .insert(schema.collaborationMessages)
      .values({
        id: Date.now().toString(),
        ...message,
      })
      .returning();

    return {
      id: newMessage.id,
      sender: newMessage.sender as "ai" | "human",
      message: newMessage.message,
      timestamp: newMessage.timestamp.toISOString(),
      requiresResponse: newMessage.requiresResponse,
      priority: newMessage.priority as "low" | "medium" | "high" | "critical",
    };
  }

  async executeEmergencyAction(action: Omit<EmergencyAction, 'timestamp'>): Promise<EmergencyAction> {
    const [newAction] = await db
      .insert(schema.emergencyActions)
      .values({
        id: Date.now().toString(),
        ...action,
      })
      .returning();

    return {
      action: newAction.action as "pause" | "stop" | "quarantine" | "override",
      reason: newAction.reason,
      timestamp: newAction.timestamp.toISOString(),
    };
  }

  async getEmergencyHistory(): Promise<EmergencyAction[]> {
    const actions = await db.select()
      .from(schema.emergencyActions)
      .orderBy(desc(schema.emergencyActions.timestamp))
      .limit(50);

    return actions.map(action => ({
      action: action.action as "pause" | "stop" | "quarantine" | "override",
      reason: action.reason,
      timestamp: action.timestamp.toISOString(),
    }));
  }

  // Cost Tracking Methods
  async addCostEntry(cost: { service: string; endpoint?: string; model?: string; tokens?: number; cost: number; requestType: string; details?: Record<string, string | number>; }): Promise<void> {
    await db.insert(schema.costTracking).values({
      id: Date.now().toString(),
      ...cost,
    });
  }

  async getCostHistory(hours: number): Promise<any[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const costs = await db.select()
      .from(schema.costTracking)
      .where(gt(schema.costTracking.timestamp, cutoff))
      .orderBy(desc(schema.costTracking.timestamp));

    return costs.map(cost => ({
      id: cost.id,
      timestamp: cost.timestamp.toISOString(),
      service: cost.service,
      endpoint: cost.endpoint,
      model: cost.model,
      tokens: cost.tokens,
      cost: cost.cost,
      requestType: cost.requestType,
      details: cost.details,
    }));
  }

  async getTotalCost(hours: number): Promise<number> {
    const history = await this.getCostHistory(hours);
    return history.reduce((total, entry) => total + entry.cost, 0);
  }
}