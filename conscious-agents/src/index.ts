/**
 * Conscious Agent Framework
 *
 * A framework for building multi-agent pipelines with:
 * - Structured handoffs between agents
 * - Shared consciousness/awareness across the pipeline
 * - Within-session learning and adaptation
 *
 * @example
 * ```typescript
 * import {
 *   createPipeline,
 *   defineAgent,
 *   definePipelineFlow,
 * } from 'conscious-agents';
 *
 * // Define agents
 * const trendScout = defineAgent(
 *   'trend-scout',
 *   'Trend Scout',
 *   'Identifies trending topics',
 *   ['trend-detection', 'data-analysis'],
 *   async (input, consciousness) => {
 *     // Agent logic here
 *     return {
 *       result: { trends: ['AI', 'Web3'] },
 *       success: true,
 *       confidence: 0.85,
 *       learnings: [],
 *       signals: ['continue'],
 *       metrics: { executionTimeMs: 1000, retryCount: 0 }
 *     };
 *   }
 * );
 *
 * // Create pipeline
 * const pipeline = createPipeline();
 * pipeline.registerAgent(trendScout);
 * pipeline.definePipeline(definePipelineFlow(
 *   'content-pipeline',
 *   'Content Creation Pipeline',
 *   ['trend-scout', 'content-creator', 'publisher']
 * ));
 *
 * // Execute
 * const result = await pipeline.executePipeline('content-pipeline', {
 *   topic: 'technology'
 * });
 * ```
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Agent types
  AgentDefinition,
  AgentExecutor,
  AgentInput,
  AgentOutput,
  ExecutionMetrics,

  // Handoff types
  HandoffContext,
  AgentTrailEntry,
  Priority,

  // Consciousness types
  ConsciousnessContext,
  SessionState,
  AttentionState,
  TemporalState,
  TemporalEvent,
  TemporalPattern,
  AgentModel,
  ValueState,
  ConsciousnessUpdater,
  AwarenessItem,
  Insight,

  // Learning types
  Learning,
  LearningType,

  // Pipeline types
  PipelineDefinition,
  PipelineResult,
  PipelineMetrics,
  PipelineHooks,
  PipelineSignal,
  AgentResultEntry,

  // Session types
  SessionMeta,
  SessionConfig,

  // Session learner types
  PerformanceGap,
  StrategyAdjustment,
  SessionLearnerState,
} from './types';

// ============================================================================
// PIPELINE EXPORTS
// ============================================================================

export {
  AgentPipeline,
  createPipeline,
  defineAgent,
  definePipelineFlow,
} from './agent-pipeline';

export type { PipelineConfig } from './agent-pipeline';

// ============================================================================
// CONSCIOUSNESS EXPORTS
// ============================================================================

export {
  createConsciousnessContext,
  applyLearnings,
  getConsciousnessSummary,
  serializeConsciousness,
  deserializeConsciousness,
} from './consciousness-context';

export type { ConsciousnessConfig } from './consciousness-context';

// ============================================================================
// HANDOFF EXPORTS
// ============================================================================

export {
  createInitialHandoff,
  createHandoff,
  validateHandoff,
  enrichHandoffWithConsciousness,
  extractRelevantLearnings,
  getTrailSummary,
  shouldContinuePipeline,
  createLearningFromOutput,
} from './handoff-protocol';

export type { HandoffOptions } from './handoff-protocol';

// ============================================================================
// SESSION LEARNER EXPORTS
// ============================================================================

export {
  SessionLearner,
  createSessionLearner,
} from './session-learner';

export type { SessionLearnerConfig } from './session-learner';
