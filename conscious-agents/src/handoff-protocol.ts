/**
 * Handoff Protocol
 *
 * Manages structured handoffs between agents in a pipeline.
 * Ensures context, learnings, and state are properly transferred.
 */

import {
  HandoffContext,
  AgentOutput,
  AgentTrailEntry,
  Learning,
  Priority,
  ConsciousnessContext,
} from './types';

export interface HandoffOptions {
  /** Priority of this handoff */
  priority?: Priority;
  /** Deadline for the receiving agent (timestamp) */
  deadline?: number;
  /** Additional metadata to pass */
  metadata?: Record<string, unknown>;
}

/**
 * Creates the initial handoff context for a pipeline
 */
export function createInitialHandoff(
  toAgent: string,
  payload: unknown,
  options: HandoffOptions = {}
): HandoffContext {
  return {
    handoffId: generateHandoffId(),
    fromAgent: null,
    toAgent,
    payload,
    learnings: [],
    agentTrail: [],
    priority: options.priority || 'medium',
    timestamp: Date.now(),
    deadline: options.deadline,
  };
}

/**
 * Creates a handoff from one agent to another
 */
export function createHandoff(
  fromAgent: string,
  toAgent: string,
  previousContext: HandoffContext,
  agentOutput: AgentOutput,
  executionTime: number
): HandoffContext {
  // Create trail entry for the completing agent
  const trailEntry: AgentTrailEntry = {
    agentId: fromAgent,
    startTime: previousContext.timestamp,
    endTime: Date.now(),
    success: agentOutput.success,
    confidence: agentOutput.confidence,
    outputSummary: summarizeOutput(agentOutput.result),
  };

  // Merge learnings
  const mergedLearnings = mergeLearnings(
    previousContext.learnings,
    agentOutput.learnings
  );

  return {
    handoffId: generateHandoffId(),
    fromAgent,
    toAgent,
    payload: agentOutput.result,
    learnings: mergedLearnings,
    agentTrail: [...previousContext.agentTrail, trailEntry],
    priority: previousContext.priority,
    timestamp: Date.now(),
    deadline: previousContext.deadline,
  };
}

/**
 * Validates a handoff context
 */
export function validateHandoff(context: HandoffContext): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!context.handoffId) {
    issues.push('Missing handoff ID');
  }

  if (!context.toAgent) {
    issues.push('Missing target agent');
  }

  if (context.deadline && context.deadline < Date.now()) {
    issues.push('Deadline has passed');
  }

  // Check for circular handoffs
  const agentIds = context.agentTrail.map((t) => t.agentId);
  if (agentIds.includes(context.toAgent)) {
    issues.push(`Circular handoff detected: ${context.toAgent} already in trail`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Enriches handoff with consciousness context
 */
export function enrichHandoffWithConsciousness(
  handoff: HandoffContext,
  consciousness: ConsciousnessContext
): HandoffContext {
  // Add relevant insights as learnings
  const insightLearnings: Learning[] = consciousness.session.insights
    .slice(0, 3) // Top 3 insights
    .map((insight) => ({
      id: `insight_${insight.id}`,
      type: 'insight' as const,
      content: insight.content,
      source: insight.source,
      confidence: insight.importance,
      timestamp: insight.timestamp,
      actionable: true,
    }));

  // Add success/failure patterns as learnings
  const patternLearnings: Learning[] = [
    ...consciousness.session.successPatterns.slice(-2).map((pattern, i) => ({
      id: `success_pattern_${i}`,
      type: 'success_pattern' as const,
      content: pattern,
      source: 'session_history',
      confidence: 0.8,
      timestamp: Date.now(),
      actionable: true,
    })),
    ...consciousness.session.failurePatterns.slice(-2).map((pattern, i) => ({
      id: `failure_pattern_${i}`,
      type: 'failure_pattern' as const,
      content: pattern,
      source: 'session_history',
      confidence: 0.8,
      timestamp: Date.now(),
      actionable: true,
    })),
  ];

  return {
    ...handoff,
    learnings: mergeLearnings(handoff.learnings, [
      ...insightLearnings,
      ...patternLearnings,
    ]),
  };
}

/**
 * Extracts learnings relevant to a specific agent
 */
export function extractRelevantLearnings(
  handoff: HandoffContext,
  agentCapabilities: string[]
): Learning[] {
  return handoff.learnings.filter((learning) => {
    // Always include high-confidence learnings
    if (learning.confidence > 0.9) return true;

    // Include if domain matches capabilities
    if (
      learning.domain &&
      agentCapabilities.some((cap) =>
        learning.domain!.toLowerCase().includes(cap.toLowerCase())
      )
    ) {
      return true;
    }

    // Include actionable learnings
    if (learning.actionable && learning.confidence > 0.7) return true;

    return false;
  });
}

/**
 * Gets a summary of the handoff trail
 */
export function getTrailSummary(handoff: HandoffContext): {
  totalAgents: number;
  successfulAgents: number;
  averageConfidence: number;
  totalTime: number;
  path: string;
} {
  const trail = handoff.agentTrail;

  if (trail.length === 0) {
    return {
      totalAgents: 0,
      successfulAgents: 0,
      averageConfidence: 0,
      totalTime: 0,
      path: '(start)',
    };
  }

  const successful = trail.filter((t) => t.success).length;
  const avgConfidence =
    trail.reduce((sum, t) => sum + t.confidence, 0) / trail.length;
  const totalTime =
    trail.length > 0
      ? trail[trail.length - 1].endTime - trail[0].startTime
      : 0;

  return {
    totalAgents: trail.length,
    successfulAgents: successful,
    averageConfidence: avgConfidence,
    totalTime,
    path: trail.map((t) => t.agentId).join(' -> '),
  };
}

/**
 * Determines if the pipeline should continue based on handoff state
 */
export function shouldContinuePipeline(
  handoff: HandoffContext,
  minConfidenceThreshold: number = 0.5
): { continue: boolean; reason: string } {
  // Check deadline
  if (handoff.deadline && Date.now() > handoff.deadline) {
    return { continue: false, reason: 'Deadline exceeded' };
  }

  // Check trail for consecutive failures
  const recentTrail = handoff.agentTrail.slice(-3);
  const recentFailures = recentTrail.filter((t) => !t.success).length;
  if (recentFailures >= 3) {
    return { continue: false, reason: 'Too many consecutive failures' };
  }

  // Check confidence trend
  if (recentTrail.length >= 2) {
    const avgRecentConfidence =
      recentTrail.reduce((sum, t) => sum + t.confidence, 0) / recentTrail.length;
    if (avgRecentConfidence < minConfidenceThreshold) {
      return {
        continue: false,
        reason: `Average confidence (${avgRecentConfidence.toFixed(2)}) below threshold`,
      };
    }
  }

  return { continue: true, reason: 'Pipeline healthy' };
}

/**
 * Creates a learning from an agent's output
 */
export function createLearningFromOutput(
  agentId: string,
  output: AgentOutput,
  type: Learning['type'] = 'insight'
): Learning {
  return {
    id: `learning_${agentId}_${Date.now()}`,
    type,
    content:
      typeof output.result === 'string'
        ? output.result.slice(0, 200)
        : JSON.stringify(output.result).slice(0, 200),
    source: agentId,
    confidence: output.confidence,
    timestamp: Date.now(),
    actionable: output.success,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateHandoffId(): string {
  return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function summarizeOutput(result: unknown): string {
  if (typeof result === 'string') {
    return result.length > 100 ? result.slice(0, 100) + '...' : result;
  }
  if (result === null || result === undefined) {
    return '(empty)';
  }
  try {
    const str = JSON.stringify(result);
    return str.length > 100 ? str.slice(0, 100) + '...' : str;
  } catch {
    return '(complex object)';
  }
}

function mergeLearnings(
  existing: Learning[],
  newLearnings: Learning[]
): Learning[] {
  const merged = [...existing];

  for (const learning of newLearnings) {
    // Check for duplicates based on content similarity
    const isDuplicate = merged.some(
      (m) =>
        m.content === learning.content ||
        (m.type === learning.type && m.source === learning.source)
    );

    if (!isDuplicate) {
      merged.push(learning);
    }
  }

  // Sort by confidence and recency
  merged.sort((a, b) => {
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
    return b.timestamp - a.timestamp;
  });

  // Keep top 20 learnings
  return merged.slice(0, 20);
}
