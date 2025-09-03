import { pgTable, varchar, text, timestamp, real, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Consciousness Modules Table
export const consciousnessModules = pgTable("consciousness_modules", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  integrationLevel: real("integration_level").notNull(),
  load: real("load").notNull(),
  metrics: json("metrics").$type<Record<string, string | number>>().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// System Metrics Table
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey(),
  consciousnessCoherence: real("consciousness_coherence").notNull(),
  creativeIntelligence: real("creative_intelligence").notNull(),
  safetyCompliance: real("safety_compliance").notNull(),
  learningEfficiency: real("learning_efficiency").notNull(),
  costPerHour: real("cost_per_hour").notNull(),
  modulesOnline: integer("modules_online").notNull(),
  totalModules: integer("total_modules").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Activity Events Table  
export const activityEvents = pgTable("activity_events", {
  id: varchar("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  moduleId: varchar("module_id", { length: 255 }),
});

// Safety Status Table
export const safetyStatus = pgTable("safety_status", {
  id: varchar("id").primaryKey(),
  ethicalCompliance: real("ethical_compliance").notNull(),
  valueAlignment: real("value_alignment").notNull(),
  safetyConstraints: boolean("safety_constraints").notNull(),
  quarantineQueueSize: integer("quarantine_queue_size").notNull(),
  lastAlert: text("last_alert"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Collaboration Messages Table
export const collaborationMessages = pgTable("collaboration_messages", {
  id: varchar("id").primaryKey(),
  sender: varchar("sender", { length: 50 }).notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  requiresResponse: boolean("requires_response").notNull(),
  priority: varchar("priority", { length: 50 }).notNull(),
});

// Emergency Actions Table
export const emergencyActions = pgTable("emergency_actions", {
  id: varchar("id").primaryKey(),
  action: varchar("action", { length: 50 }).notNull(),
  reason: text("reason").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Cost Tracking Table
export const costTracking = pgTable("cost_tracking", {
  id: varchar("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  service: varchar("service", { length: 100 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }),
  model: varchar("model", { length: 100 }),
  tokens: integer("tokens"),
  cost: real("cost").notNull(),
  requestType: varchar("request_type", { length: 100 }).notNull(),
  details: json("details").$type<Record<string, string | number>>(),
});

// Conversation Memory Table for Temporal Consciousness
export const conversationMemory = pgTable("conversation_memory", {
  id: varchar("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata").$type<Record<string, string | number>>(),
});

// Temporal Events for consciousness timeline
export const temporalEvents = pgTable("temporal_events", {
  id: varchar("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  confidence: real("confidence").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  predictedFor: timestamp("predicted_for"),
  actualOutcome: text("actual_outcome"),
  moduleId: varchar("module_id", { length: 255 }),
});

// Knowledge Nodes for graph storage
export const knowledgeNodes = pgTable("knowledge_nodes", {
  id: varchar("id").primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  position: json("position").$type<{ x: number; y: number }>().notNull(),
  connections: json("connections").$type<string[]>().notNull(),
  weight: real("weight").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for inserts
export const insertConsciousnessModuleSchema = createInsertSchema(consciousnessModules).omit({
  lastUpdated: true
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true
});

export const insertActivityEventSchema = createInsertSchema(activityEvents).omit({
  id: true,
  timestamp: true
});

export const insertSafetyStatusSchema = createInsertSchema(safetyStatus).omit({
  id: true,
  timestamp: true
});

export const insertCollaborationMessageSchema = createInsertSchema(collaborationMessages).omit({
  id: true,
  timestamp: true
});

export const insertEmergencyActionSchema = createInsertSchema(emergencyActions).omit({
  id: true,
  timestamp: true
});

export const insertCostTrackingSchema = createInsertSchema(costTracking).omit({
  id: true,
  timestamp: true
});

export const insertConversationMemorySchema = createInsertSchema(conversationMemory).omit({
  id: true,
  timestamp: true
});

export const insertTemporalEventSchema = createInsertSchema(temporalEvents).omit({
  id: true,
  timestamp: true
});

export const insertKnowledgeNodeSchema = createInsertSchema(knowledgeNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Export types
export type ConsciousnessModule = typeof consciousnessModules.$inferSelect;
export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type SafetyStatus = typeof safetyStatus.$inferSelect;
export type CollaborationMessage = typeof collaborationMessages.$inferSelect;
export type EmergencyAction = typeof emergencyActions.$inferSelect;
export type CostTracking = typeof costTracking.$inferSelect;
export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type TemporalEvent = typeof temporalEvents.$inferSelect;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;

export type InsertConsciousnessModule = z.infer<typeof insertConsciousnessModuleSchema>;
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;
export type InsertSafetyStatus = z.infer<typeof insertSafetyStatusSchema>;
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;
export type InsertEmergencyAction = z.infer<typeof insertEmergencyActionSchema>;
export type InsertCostTracking = z.infer<typeof insertCostTrackingSchema>;
export type InsertConversationMemory = z.infer<typeof insertConversationMemorySchema>;
export type InsertTemporalEvent = z.infer<typeof insertTemporalEventSchema>;
export type InsertKnowledgeNode = z.infer<typeof insertKnowledgeNodeSchema>;