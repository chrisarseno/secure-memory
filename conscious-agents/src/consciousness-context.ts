/**
 * Consciousness Context
 *
 * Shared awareness layer that provides continuity across agent handoffs.
 * Implements attention management, temporal memory, and agent modeling.
 */

import {
  ConsciousnessContext,
  SessionState,
  AttentionState,
  TemporalState,
  AgentModel,
  ValueState,
  ConsciousnessUpdater,
  AwarenessItem,
  TemporalEvent,
  TemporalPattern,
  Insight,
  Learning,
} from './types';

export interface ConsciousnessConfig {
  /** Maximum items in awareness stack */
  maxAwarenessItems: number;
  /** Maximum immediate memory events */
  maxImmediateEvents: number;
  /** Maximum short-term memory events */
  maxShortTermEvents: number;
  /** Decay rate for temporal events (0-1, per minute) */
  temporalDecayRate: number;
  /** Minimum significance to retain events */
  minSignificance: number;
}

const DEFAULT_CONFIG: ConsciousnessConfig = {
  maxAwarenessItems: 10,
  maxImmediateEvents: 50,
  maxShortTermEvents: 200,
  temporalDecayRate: 0.1,
  minSignificance: 0.3,
};

/**
 * Creates a new consciousness context for a session
 */
export function createConsciousnessContext(
  sessionId: string,
  initialGoal: string,
  config: Partial<ConsciousnessConfig> = {}
): ConsciousnessContext {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize session state
  const session: SessionState = {
    sessionId,
    startTime: Date.now(),
    currentPhase: 'initialization',
    successPatterns: [],
    failurePatterns: [],
    insights: [],
    performanceScore: 0.5, // Start neutral
  };

  // Initialize attention state
  const attention: AttentionState = {
    focus: initialGoal,
    awarenessStack: [
      {
        id: `awareness_${Date.now()}_init`,
        content: initialGoal,
        priority: 1.0,
        source: 'session_init',
        timestamp: Date.now(),
      },
    ],
    coherence: 1.0,
  };

  // Initialize temporal state
  const temporal: TemporalState = {
    immediate: [],
    shortTerm: [],
    patterns: [],
  };

  // Initialize social models (agent models)
  const socialModels = new Map<string, AgentModel>();

  // Initialize value state
  const values: ValueState = {
    currentGoal: initialGoal,
    subGoals: [],
    constraints: [],
    qualityThreshold: 0.7,
  };

  // Create the updater functions
  const update = createUpdater(
    session,
    attention,
    temporal,
    socialModels,
    fullConfig
  );

  return {
    session,
    attention,
    temporal,
    socialModels,
    values,
    update,
  };
}

/**
 * Creates the consciousness updater with bound state
 */
function createUpdater(
  session: SessionState,
  attention: AttentionState,
  temporal: TemporalState,
  socialModels: Map<string, AgentModel>,
  config: ConsciousnessConfig
): ConsciousnessUpdater {
  return {
    attend: (item: AwarenessItem) => {
      // Add to awareness stack, maintaining priority order
      attention.awarenessStack.push(item);
      attention.awarenessStack.sort((a, b) => b.priority - a.priority);

      // Trim to max size
      if (attention.awarenessStack.length > config.maxAwarenessItems) {
        attention.awarenessStack = attention.awarenessStack.slice(
          0,
          config.maxAwarenessItems
        );
      }

      // Update focus to highest priority item
      if (attention.awarenessStack.length > 0) {
        attention.focus = attention.awarenessStack[0].content;
      }

      // Recalculate coherence based on how related items are
      attention.coherence = calculateCoherence(attention.awarenessStack);
    },

    recordEvent: (event: Omit<TemporalEvent, 'id'>) => {
      const fullEvent: TemporalEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      };

      // Add to immediate memory
      temporal.immediate.push(fullEvent);

      // Trim immediate memory
      if (temporal.immediate.length > config.maxImmediateEvents) {
        // Move oldest to short-term if significant enough
        const oldest = temporal.immediate.shift()!;
        if (oldest.significance >= config.minSignificance) {
          temporal.shortTerm.push(oldest);
        }
      }

      // Trim short-term memory
      if (temporal.shortTerm.length > config.maxShortTermEvents) {
        temporal.shortTerm.shift();
      }

      // Detect patterns
      detectPatterns(temporal);
    },

    updateAgentModel: (agentId: string, update: Partial<AgentModel>) => {
      const existing = socialModels.get(agentId);

      if (existing) {
        // Update existing model
        const updated: AgentModel = {
          ...existing,
          ...update,
          lastInteraction: Date.now(),
        };

        // Update performance history if provided
        if (update.performanceHistory) {
          updated.performanceHistory = [
            ...existing.performanceHistory.slice(-19), // Keep last 20
            ...update.performanceHistory,
          ];

          // Recalculate trust based on performance
          const avgPerformance =
            updated.performanceHistory.reduce((a, b) => a + b, 0) /
            updated.performanceHistory.length;
          updated.trust = avgPerformance * 0.7 + existing.trust * 0.3;
        }

        socialModels.set(agentId, updated);
      } else {
        // Create new model
        const newModel: AgentModel = {
          agentId,
          capabilities: update.capabilities || [],
          trust: update.trust ?? 0.5,
          performanceHistory: update.performanceHistory || [],
          expectedResponseTime: update.expectedResponseTime || 5000,
          lastInteraction: Date.now(),
        };
        socialModels.set(agentId, newModel);
      }
    },

    addInsight: (insight: Insight) => {
      session.insights.push(insight);

      // Keep insights sorted by importance
      session.insights.sort((a, b) => b.importance - a.importance);

      // Limit to top 50 insights
      if (session.insights.length > 50) {
        session.insights = session.insights.slice(0, 50);
      }
    },

    updatePerformance: (delta: number) => {
      session.performanceScore = Math.max(
        0,
        Math.min(1, session.performanceScore + delta)
      );
    },
  };
}

/**
 * Calculate coherence of awareness stack
 * Higher coherence means items are related/aligned
 */
function calculateCoherence(items: AwarenessItem[]): number {
  if (items.length <= 1) return 1.0;

  // Simple coherence: based on recency and source diversity
  const now = Date.now();
  const recencyScores = items.map((item) => {
    const ageMs = now - item.timestamp;
    return Math.exp(-ageMs / 60000); // Decay over 1 minute
  });

  const avgRecency =
    recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length;

  // Source diversity (more diverse = potentially less coherent)
  const uniqueSources = new Set(items.map((i) => i.source)).size;
  const diversityPenalty = Math.min(0.3, (uniqueSources - 1) * 0.1);

  return Math.max(0.1, avgRecency - diversityPenalty);
}

/**
 * Detect temporal patterns in event history
 */
function detectPatterns(temporal: TemporalState): void {
  const allEvents = [...temporal.immediate, ...temporal.shortTerm];

  // Count event types
  const typeCounts = new Map<string, number>();
  for (const event of allEvents) {
    typeCounts.set(event.type, (typeCounts.get(event.type) || 0) + 1);
  }

  // Create or update patterns for frequent types
  for (const [type, count] of typeCounts) {
    if (count >= 3) {
      // Threshold for pattern detection
      const existingPattern = temporal.patterns.find((p) =>
        p.description.includes(type)
      );

      if (existingPattern) {
        existingPattern.frequency = count;
        existingPattern.lastSeen = Date.now();
        existingPattern.confidence = Math.min(1, existingPattern.confidence + 0.1);
      } else {
        temporal.patterns.push({
          id: `pattern_${Date.now()}_${type}`,
          description: `Recurring ${type} events`,
          frequency: count,
          lastSeen: Date.now(),
          confidence: 0.5,
        });
      }
    }
  }

  // Decay old patterns
  temporal.patterns = temporal.patterns.filter((pattern) => {
    const ageMs = Date.now() - pattern.lastSeen;
    if (ageMs > 300000) {
      // 5 minutes
      pattern.confidence -= 0.2;
    }
    return pattern.confidence > 0.1;
  });
}

/**
 * Apply learnings to the consciousness context
 */
export function applyLearnings(
  context: ConsciousnessContext,
  learnings: Learning[]
): void {
  for (const learning of learnings) {
    // Record as temporal event
    context.update.recordEvent({
      type: `learning_${learning.type}`,
      content: learning,
      timestamp: learning.timestamp,
      significance: learning.confidence,
      decayRate: 0.05, // Learnings decay slowly
    });

    // Update session patterns
    if (learning.type === 'success_pattern') {
      context.session.successPatterns.push(learning.content);
      context.update.updatePerformance(0.05);
    } else if (learning.type === 'failure_pattern') {
      context.session.failurePatterns.push(learning.content);
      context.update.updatePerformance(-0.03);
    }

    // Add as insight if important enough
    if (learning.confidence > 0.7 && learning.actionable) {
      context.update.addInsight({
        id: `insight_${learning.id}`,
        content: learning.content,
        importance: learning.confidence,
        timestamp: learning.timestamp,
        source: learning.source,
      });
    }
  }
}

/**
 * Get a summary of the current consciousness state
 */
export function getConsciousnessSummary(context: ConsciousnessContext): {
  focus: string;
  coherence: number;
  performanceScore: number;
  topInsights: string[];
  knownAgents: string[];
  recentPatterns: string[];
} {
  return {
    focus: context.attention.focus,
    coherence: context.attention.coherence,
    performanceScore: context.session.performanceScore,
    topInsights: context.session.insights.slice(0, 5).map((i) => i.content),
    knownAgents: Array.from(context.socialModels.keys()),
    recentPatterns: context.temporal.patterns.slice(0, 5).map((p) => p.description),
  };
}

/**
 * Serialize consciousness context for persistence or transfer
 */
export function serializeConsciousness(
  context: ConsciousnessContext
): string {
  return JSON.stringify({
    session: context.session,
    attention: context.attention,
    temporal: context.temporal,
    socialModels: Array.from(context.socialModels.entries()),
    values: context.values,
  });
}

/**
 * Deserialize consciousness context
 */
export function deserializeConsciousness(
  serialized: string,
  config: Partial<ConsciousnessConfig> = {}
): ConsciousnessContext {
  const data = JSON.parse(serialized);
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const socialModels = new Map<string, AgentModel>(data.socialModels);

  const update = createUpdater(
    data.session,
    data.attention,
    data.temporal,
    socialModels,
    fullConfig
  );

  return {
    session: data.session,
    attention: data.attention,
    temporal: data.temporal,
    socialModels,
    values: data.values,
    update,
  };
}
