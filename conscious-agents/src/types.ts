/**
 * Conscious Agent Framework - Core Types
 *
 * Types for building multi-agent pipelines with handoffs,
 * shared consciousness, and within-session learning.
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  /** Function that executes the agent's mission */
  execute: AgentExecutor;
  /** Optional: Conditions for when this agent should be selected */
  canHandle?: (context: HandoffContext) => boolean;
}

export type AgentExecutor = (
  input: AgentInput,
  context: ConsciousnessContext
) => Promise<AgentOutput>;

export interface AgentInput {
  /** The primary payload/task for this agent */
  payload: unknown;
  /** Context passed from previous agent in pipeline */
  handoffContext: HandoffContext;
  /** Session-level metadata */
  sessionMeta: SessionMeta;
}

export interface AgentOutput {
  /** The result of this agent's work */
  result: unknown;
  /** Whether this agent completed its mission successfully */
  success: boolean;
  /** Confidence in the output (0-1) */
  confidence: number;
  /** Learnings to pass to the next agent */
  learnings: Learning[];
  /** Explicit handoff to a specific next agent (optional) */
  nextAgent?: string;
  /** Signals to the pipeline */
  signals: PipelineSignal[];
  /** Performance metrics for this execution */
  metrics: ExecutionMetrics;
}

export interface ExecutionMetrics {
  executionTimeMs: number;
  tokensUsed?: number;
  cost?: number;
  modelUsed?: string;
  retryCount: number;
}

// ============================================================================
// HANDOFF TYPES
// ============================================================================

export interface HandoffContext {
  /** Unique ID for this handoff */
  handoffId: string;
  /** ID of the agent handing off */
  fromAgent: string | null;
  /** ID of the agent receiving */
  toAgent: string;
  /** The payload being passed */
  payload: unknown;
  /** Accumulated learnings from the pipeline */
  learnings: Learning[];
  /** Trail of agents in this session */
  agentTrail: AgentTrailEntry[];
  /** Priority level for this handoff */
  priority: Priority;
  /** Timestamp of handoff initiation */
  timestamp: number;
  /** Optional deadline for the receiving agent */
  deadline?: number;
}

export interface AgentTrailEntry {
  agentId: string;
  startTime: number;
  endTime: number;
  success: boolean;
  confidence: number;
  outputSummary?: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// CONSCIOUSNESS / SHARED STATE TYPES
// ============================================================================

export interface ConsciousnessContext {
  /** Session-level awareness */
  session: SessionState;
  /** Global workspace - what the system is currently "attending to" */
  attention: AttentionState;
  /** Temporal awareness - memory across timescales */
  temporal: TemporalState;
  /** Social cognition - models of other agents */
  socialModels: Map<string, AgentModel>;
  /** Value/goal tracking */
  values: ValueState;
  /** Methods to update consciousness */
  update: ConsciousnessUpdater;
}

export interface SessionState {
  sessionId: string;
  startTime: number;
  currentPhase: string;
  /** What has worked well this session */
  successPatterns: string[];
  /** What has failed this session */
  failurePatterns: string[];
  /** Accumulated insights */
  insights: Insight[];
  /** Current performance score (0-1) */
  performanceScore: number;
}

export interface AttentionState {
  /** Current focus of attention */
  focus: string;
  /** Priority-ordered items in awareness */
  awarenessStack: AwarenessItem[];
  /** Coherence of current focus (0-1) */
  coherence: number;
}

export interface AwarenessItem {
  id: string;
  content: string;
  priority: number;
  source: string;
  timestamp: number;
}

export interface TemporalState {
  /** Recent events (last few minutes) */
  immediate: TemporalEvent[];
  /** Short-term memory (this session) */
  shortTerm: TemporalEvent[];
  /** Patterns detected across time */
  patterns: TemporalPattern[];
}

export interface TemporalEvent {
  id: string;
  type: string;
  content: unknown;
  timestamp: number;
  significance: number;
  decayRate: number;
}

export interface TemporalPattern {
  id: string;
  description: string;
  frequency: number;
  lastSeen: number;
  confidence: number;
}

export interface AgentModel {
  agentId: string;
  /** Beliefs about this agent's capabilities */
  capabilities: string[];
  /** Trust level (0-1) */
  trust: number;
  /** Performance history with this agent */
  performanceHistory: number[];
  /** Predicted response time */
  expectedResponseTime: number;
  /** Last interaction timestamp */
  lastInteraction: number;
}

export interface ValueState {
  /** Current mission/goal */
  currentGoal: string;
  /** Sub-goals derived from main goal */
  subGoals: string[];
  /** Constraints to respect */
  constraints: string[];
  /** Quality bar for outputs */
  qualityThreshold: number;
}

export interface ConsciousnessUpdater {
  /** Add an item to attention */
  attend: (item: AwarenessItem) => void;
  /** Record a temporal event */
  recordEvent: (event: Omit<TemporalEvent, 'id'>) => void;
  /** Update agent model based on interaction */
  updateAgentModel: (agentId: string, update: Partial<AgentModel>) => void;
  /** Add an insight */
  addInsight: (insight: Insight) => void;
  /** Update performance score */
  updatePerformance: (delta: number) => void;
}

// ============================================================================
// LEARNING TYPES
// ============================================================================

export interface Learning {
  id: string;
  type: LearningType;
  content: string;
  source: string;
  confidence: number;
  timestamp: number;
  /** Can be applied to improve future executions */
  actionable: boolean;
  /** Specific domain this learning applies to */
  domain?: string;
}

export type LearningType =
  | 'success_pattern'    // Something that worked well
  | 'failure_pattern'    // Something that failed
  | 'insight'           // General insight
  | 'strategy'          // Strategic learning
  | 'correction'        // Correction from feedback
  | 'optimization';     // Performance optimization

export interface Insight {
  id: string;
  content: string;
  importance: number;
  timestamp: number;
  source: string;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  /** Ordered list of agent IDs (can be overridden by agent outputs) */
  agents: string[];
  /** Optional: Dynamic agent selection based on context */
  selectNextAgent?: (context: HandoffContext, available: AgentDefinition[]) => string | null;
  /** Hooks for pipeline events */
  hooks?: PipelineHooks;
}

export interface PipelineHooks {
  /** Called before each agent execution */
  beforeAgent?: (agentId: string, context: HandoffContext) => Promise<void>;
  /** Called after each agent execution */
  afterAgent?: (agentId: string, output: AgentOutput, context: HandoffContext) => Promise<void>;
  /** Called on pipeline completion */
  onComplete?: (results: PipelineResult) => Promise<void>;
  /** Called on pipeline error */
  onError?: (error: Error, agentId: string, context: HandoffContext) => Promise<void>;
}

export interface PipelineResult {
  pipelineId: string;
  sessionId: string;
  success: boolean;
  agentResults: AgentResultEntry[];
  totalExecutionTime: number;
  learnings: Learning[];
  finalOutput: unknown;
  metrics: PipelineMetrics;
}

export interface AgentResultEntry {
  agentId: string;
  success: boolean;
  confidence: number;
  executionTime: number;
  output: unknown;
}

export interface PipelineMetrics {
  totalAgentsRun: number;
  successfulAgents: number;
  failedAgents: number;
  totalTokens: number;
  totalCost: number;
  averageConfidence: number;
  learningsGenerated: number;
}

export type PipelineSignal =
  | 'continue'          // Continue to next agent
  | 'skip_next'         // Skip the next agent in sequence
  | 'halt'              // Stop the pipeline
  | 'retry'             // Retry this agent
  | 'escalate'          // Escalate to human/higher authority
  | 'branch';           // Branch to a different pipeline

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface SessionMeta {
  sessionId: string;
  startTime: number;
  /** Original input that started this session */
  originalInput: unknown;
  /** User/system that initiated the session */
  initiator: string;
  /** Tags for categorization */
  tags: string[];
  /** Session-level configuration */
  config: SessionConfig;
}

export interface SessionConfig {
  /** Maximum agents to run in a single session */
  maxAgents: number;
  /** Maximum execution time for session (ms) */
  maxExecutionTime: number;
  /** Enable within-session learning */
  enableLearning: boolean;
  /** Minimum confidence to continue pipeline */
  minConfidenceThreshold: number;
  /** Cost budget for the session */
  costBudget?: number;
}

// ============================================================================
// SESSION LEARNER TYPES
// ============================================================================

export interface PerformanceGap {
  id: string;
  domain: string;
  severity: number;
  description: string;
  suggestedFix: string;
  detectedAt: number;
}

export interface StrategyAdjustment {
  id: string;
  type: 'routing' | 'threshold' | 'retry' | 'skip';
  description: string;
  appliedAt: number;
  impact: number;
}

export interface SessionLearnerState {
  gaps: PerformanceGap[];
  adjustments: StrategyAdjustment[];
  performanceTrend: 'improving' | 'stable' | 'declining';
  recommendedActions: string[];
}
