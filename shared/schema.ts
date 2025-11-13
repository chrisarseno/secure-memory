import { z } from "zod";

// Consciousness Module Status
export const consciousnessModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive", "error", "warning"]),
  integrationLevel: z.number().min(0).max(100),
  load: z.number().min(0).max(100),
  metrics: z.record(z.union([z.string(), z.number()])),
  lastUpdated: z.string(),
});

export const insertConsciousnessModuleSchema = consciousnessModuleSchema.omit({
  lastUpdated: true,
});

export type ConsciousnessModule = z.infer<typeof consciousnessModuleSchema>;
export type InsertConsciousnessModule = z.infer<typeof insertConsciousnessModuleSchema>;

// System Metrics
export const systemMetricsSchema = z.object({
  id: z.string(),
  consciousnessCoherence: z.number().min(0).max(100),
  creativeIntelligence: z.number().min(0).max(100),
  safetyCompliance: z.number().min(0).max(100),
  learningEfficiency: z.number().min(0).max(100),
  costPerHour: z.number(),
  modulesOnline: z.number(),
  totalModules: z.number(),
  timestamp: z.string(),
});

export type SystemMetrics = z.infer<typeof systemMetricsSchema>;

// Activity Feed
export const activityEventSchema = z.object({
  id: z.string(),
  type: z.enum(["virtue", "creative", "social", "temporal", "knowledge", "safety", "error", "learning", "system"]),
  message: z.string(),
  timestamp: z.string(),
  moduleId: z.string().optional(),
});

export const insertActivityEventSchema = activityEventSchema.omit({
  id: true,
  timestamp: true,
});

export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;

// Safety Monitor
export const safetyStatusSchema = z.object({
  id: z.string(),
  ethicalCompliance: z.number().min(0).max(100),
  valueAlignment: z.number().min(0).max(100),
  safetyConstraints: z.boolean(),
  quarantineQueueSize: z.number(),
  lastAlert: z.string().optional(),
  timestamp: z.string(),
});

export type SafetyStatus = z.infer<typeof safetyStatusSchema>;

// Knowledge Graph
export const knowledgeNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["concept", "entity", "relation", "module"]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  connections: z.array(z.string()),
  weight: z.number(),
});

export const knowledgeGraphSchema = z.object({
  nodes: z.array(knowledgeNodeSchema),
  totalNodes: z.number(),
  totalEdges: z.number(),
  clusters: z.number(),
});

export type KnowledgeNode = z.infer<typeof knowledgeNodeSchema>;
export type KnowledgeGraph = z.infer<typeof knowledgeGraphSchema>;

// AI Collaboration
export const collaborationMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(["ai", "human"]),
  message: z.string(),
  timestamp: z.string(),
  requiresResponse: z.boolean(),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export const insertCollaborationMessageSchema = collaborationMessageSchema.omit({
  id: true,
  timestamp: true,
});

export type CollaborationMessage = z.infer<typeof collaborationMessageSchema>;
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;

// Emergency Actions
export const emergencyActionSchema = z.object({
  action: z.enum(["pause", "stop", "quarantine", "override"]),
  reason: z.string(),
  timestamp: z.string(),
});

export type EmergencyAction = z.infer<typeof emergencyActionSchema>;

// Cost Tracking
export const costTrackingSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  service: z.string(), // "openai", "compute", etc.
  endpoint: z.string().optional(), // API endpoint called
  model: z.string().optional(), // AI model used
  tokens: z.number().optional(), // tokens consumed
  cost: z.number(), // actual cost in USD
  requestType: z.string(), // "chat", "completion", "embedding", etc.
  details: z.record(z.union([z.string(), z.number()])).optional(),
});

export const insertCostTrackingSchema = costTrackingSchema.omit({
  id: true,
  timestamp: true,
});

export type CostTracking = z.infer<typeof costTrackingSchema>;
export type InsertCostTracking = z.infer<typeof insertCostTrackingSchema>;

// Conversation Memory
export const conversationMemorySchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.union([z.string(), z.number()])).optional(),
});

export const insertConversationMemorySchema = conversationMemorySchema.omit({
  id: true,
  timestamp: true,
});

export type ConversationMemory = z.infer<typeof conversationMemorySchema>;
export type InsertConversationMemory = z.infer<typeof insertConversationMemorySchema>;
