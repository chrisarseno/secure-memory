import { z } from 'zod';
import { insertConsciousnessModuleSchema } from './db-schema';

/**
 * Validation schemas for PATCH/UPDATE operations
 * These allow partial updates (all fields optional)
 */

export const updateModuleSchema = insertConsciousnessModuleSchema.partial();

export const updateSafetyStatusSchema = z.object({
  ethicalCompliance: z.number().min(0).max(100).optional(),
  valueAlignment: z.number().min(0).max(100).optional(),
  safetyConstraints: z.boolean().optional(),
  quarantineQueueSize: z.number().min(0).optional(),
  lastAlert: z.string().optional(),
}).strict();

export const updateMetricsSchema = z.object({
  consciousnessCoherence: z.number().min(0).max(100).optional(),
  creativeIntelligence: z.number().min(0).max(100).optional(),
  safetyCompliance: z.number().min(0).max(100).optional(),
  learningEfficiency: z.number().min(0).max(100).optional(),
  costPerHour: z.number().min(0).optional(),
  modulesOnline: z.number().min(0).optional(),
  totalModules: z.number().min(0).optional(),
}).strict();
