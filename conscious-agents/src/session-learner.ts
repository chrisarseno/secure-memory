/**
 * Session Learner
 *
 * Enables within-session learning and adaptation.
 * Tracks performance, identifies gaps, and adjusts strategies mid-run.
 */

import {
  AgentOutput,
  ConsciousnessContext,
  Learning,
  PerformanceGap,
  StrategyAdjustment,
  SessionLearnerState,
  AgentDefinition,
  HandoffContext,
} from './types';

export interface SessionLearnerConfig {
  /** Minimum confidence to consider an agent successful */
  successThreshold: number;
  /** Number of failures before adjusting strategy */
  failureThresholdForAdjustment: number;
  /** Enable automatic strategy adjustments */
  enableAutoAdjust: boolean;
  /** Maximum adjustments per session */
  maxAdjustments: number;
}

const DEFAULT_CONFIG: SessionLearnerConfig = {
  successThreshold: 0.7,
  failureThresholdForAdjustment: 2,
  enableAutoAdjust: true,
  maxAdjustments: 10,
};

interface AgentPerformanceRecord {
  agentId: string;
  executions: number;
  successes: number;
  failures: number;
  avgConfidence: number;
  avgExecutionTime: number;
  recentResults: boolean[]; // Last 5 results
}

interface RoutingAdjustment {
  fromAgent: string;
  toAgent: string;
  reason: string;
  appliedAt: number;
}

/**
 * Session Learner - tracks and improves performance within a session
 */
export class SessionLearner {
  private config: SessionLearnerConfig;
  private agentPerformance: Map<string, AgentPerformanceRecord> = new Map();
  private gaps: PerformanceGap[] = [];
  private adjustments: StrategyAdjustment[] = [];
  private routingOverrides: Map<string, string> = new Map(); // fromAgent -> toAgent
  private skipList: Set<string> = new Set(); // Agents to skip
  private retryBudget: Map<string, number> = new Map(); // agentId -> retries remaining

  constructor(config: Partial<SessionLearnerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record an agent's execution result
   */
  recordExecution(
    agentId: string,
    output: AgentOutput,
    consciousness: ConsciousnessContext
  ): void {
    const record = this.getOrCreateRecord(agentId);
    const success = output.success && output.confidence >= this.config.successThreshold;

    // Update record
    record.executions++;
    if (success) {
      record.successes++;
    } else {
      record.failures++;
    }

    // Update running averages
    record.avgConfidence =
      (record.avgConfidence * (record.executions - 1) + output.confidence) /
      record.executions;
    record.avgExecutionTime =
      (record.avgExecutionTime * (record.executions - 1) +
        output.metrics.executionTimeMs) /
      record.executions;

    // Track recent results
    record.recentResults.push(success);
    if (record.recentResults.length > 5) {
      record.recentResults.shift();
    }

    // Update consciousness
    consciousness.update.updateAgentModel(agentId, {
      performanceHistory: [output.confidence],
      trust: success ? 0.1 : -0.1, // Delta update
    });

    // Check for gaps and adjustments
    if (this.config.enableAutoAdjust) {
      this.checkForGaps(agentId, record);
      this.maybeAdjustStrategy(agentId, record, consciousness);
    }
  }

  /**
   * Check if an agent should be skipped
   */
  shouldSkipAgent(agentId: string): boolean {
    return this.skipList.has(agentId);
  }

  /**
   * Get routing override for an agent (if any)
   */
  getRoutingOverride(agentId: string): string | null {
    return this.routingOverrides.get(agentId) || null;
  }

  /**
   * Check if an agent can retry
   */
  canRetry(agentId: string): boolean {
    const budget = this.retryBudget.get(agentId);
    return budget === undefined || budget > 0;
  }

  /**
   * Use a retry for an agent
   */
  useRetry(agentId: string): void {
    const current = this.retryBudget.get(agentId) ?? 2; // Default 2 retries
    this.retryBudget.set(agentId, current - 1);
  }

  /**
   * Get the best available agent for a task based on learned performance
   */
  selectBestAgent(
    candidates: AgentDefinition[],
    context: HandoffContext
  ): AgentDefinition | null {
    if (candidates.length === 0) return null;

    // Filter out skipped agents
    const available = candidates.filter((a) => !this.skipList.has(a.id));
    if (available.length === 0) return null;

    // Score each agent
    const scored = available.map((agent) => {
      const record = this.agentPerformance.get(agent.id);
      let score = 0.5; // Base score

      if (record) {
        // Performance-based scoring
        const successRate =
          record.executions > 0 ? record.successes / record.executions : 0.5;
        score = successRate * 0.4 + record.avgConfidence * 0.4;

        // Recent trend bonus/penalty
        const recentSuccessRate =
          record.recentResults.filter((r) => r).length /
          Math.max(1, record.recentResults.length);
        score += (recentSuccessRate - 0.5) * 0.2;
      }

      // Capability match bonus
      if (agent.canHandle && agent.canHandle(context)) {
        score += 0.1;
      }

      return { agent, score };
    });

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].agent;
  }

  /**
   * Generate learnings from session performance
   */
  generateSessionLearnings(): Learning[] {
    const learnings: Learning[] = [];

    // Generate learnings from performance records
    for (const [agentId, record] of this.agentPerformance) {
      if (record.executions >= 2) {
        const successRate = record.successes / record.executions;

        if (successRate >= 0.8) {
          learnings.push({
            id: `learning_${agentId}_success`,
            type: 'success_pattern',
            content: `Agent ${agentId} performed well (${(successRate * 100).toFixed(0)}% success rate)`,
            source: 'session_learner',
            confidence: successRate,
            timestamp: Date.now(),
            actionable: true,
            domain: agentId,
          });
        } else if (successRate < 0.5) {
          learnings.push({
            id: `learning_${agentId}_failure`,
            type: 'failure_pattern',
            content: `Agent ${agentId} struggled (${(successRate * 100).toFixed(0)}% success rate)`,
            source: 'session_learner',
            confidence: 1 - successRate,
            timestamp: Date.now(),
            actionable: true,
            domain: agentId,
          });
        }
      }
    }

    // Generate learnings from adjustments
    for (const adjustment of this.adjustments) {
      learnings.push({
        id: `learning_adjustment_${adjustment.id}`,
        type: 'strategy',
        content: `Strategy adjusted: ${adjustment.description}`,
        source: 'session_learner',
        confidence: 0.7,
        timestamp: adjustment.appliedAt,
        actionable: true,
      });
    }

    return learnings;
  }

  /**
   * Get current learner state
   */
  getState(): SessionLearnerState {
    const records = Array.from(this.agentPerformance.values());
    const avgSuccessRate =
      records.length > 0
        ? records.reduce(
            (sum, r) => sum + (r.executions > 0 ? r.successes / r.executions : 0),
            0
          ) / records.length
        : 0;

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (records.length > 0) {
      const recentSuccesses = records.flatMap((r) => r.recentResults);
      const firstHalf = recentSuccesses.slice(0, Math.floor(recentSuccesses.length / 2));
      const secondHalf = recentSuccesses.slice(Math.floor(recentSuccesses.length / 2));

      const firstRate =
        firstHalf.filter((r) => r).length / Math.max(1, firstHalf.length);
      const secondRate =
        secondHalf.filter((r) => r).length / Math.max(1, secondHalf.length);

      if (secondRate > firstRate + 0.1) trend = 'improving';
      else if (secondRate < firstRate - 0.1) trend = 'declining';
    }

    return {
      gaps: this.gaps,
      adjustments: this.adjustments,
      performanceTrend: trend,
      recommendedActions: this.generateRecommendations(),
    };
  }

  /**
   * Reset learner state (for new session)
   */
  reset(): void {
    this.agentPerformance.clear();
    this.gaps = [];
    this.adjustments = [];
    this.routingOverrides.clear();
    this.skipList.clear();
    this.retryBudget.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getOrCreateRecord(agentId: string): AgentPerformanceRecord {
    let record = this.agentPerformance.get(agentId);
    if (!record) {
      record = {
        agentId,
        executions: 0,
        successes: 0,
        failures: 0,
        avgConfidence: 0,
        avgExecutionTime: 0,
        recentResults: [],
      };
      this.agentPerformance.set(agentId, record);
    }
    return record;
  }

  private checkForGaps(agentId: string, record: AgentPerformanceRecord): void {
    // Check for performance gap
    if (
      record.executions >= 2 &&
      record.failures / record.executions > 0.5
    ) {
      const existingGap = this.gaps.find((g) => g.domain === agentId);
      if (!existingGap) {
        this.gaps.push({
          id: `gap_${agentId}_${Date.now()}`,
          domain: agentId,
          severity: record.failures / record.executions,
          description: `Agent ${agentId} has high failure rate`,
          suggestedFix: `Consider skipping or replacing ${agentId}`,
          detectedAt: Date.now(),
        });
      }
    }

    // Check for slow execution
    if (record.avgExecutionTime > 30000 && record.executions >= 2) {
      const existingGap = this.gaps.find(
        (g) => g.domain === agentId && g.description.includes('slow')
      );
      if (!existingGap) {
        this.gaps.push({
          id: `gap_${agentId}_slow_${Date.now()}`,
          domain: agentId,
          severity: Math.min(1, record.avgExecutionTime / 60000),
          description: `Agent ${agentId} is slow (avg ${(record.avgExecutionTime / 1000).toFixed(1)}s)`,
          suggestedFix: `Consider timeout or parallel execution`,
          detectedAt: Date.now(),
        });
      }
    }
  }

  private maybeAdjustStrategy(
    agentId: string,
    record: AgentPerformanceRecord,
    consciousness: ConsciousnessContext
  ): void {
    if (this.adjustments.length >= this.config.maxAdjustments) {
      return; // Adjustment budget exhausted
    }

    // Check for consecutive failures
    const consecutiveFailures = this.countConsecutiveFailures(record.recentResults);

    if (consecutiveFailures >= this.config.failureThresholdForAdjustment) {
      // Add to skip list
      this.skipList.add(agentId);

      const adjustment: StrategyAdjustment = {
        id: `adj_skip_${agentId}_${Date.now()}`,
        type: 'skip',
        description: `Skipping ${agentId} due to ${consecutiveFailures} consecutive failures`,
        appliedAt: Date.now(),
        impact: 0, // Will be measured later
      };

      this.adjustments.push(adjustment);

      // Update consciousness
      consciousness.session.failurePatterns.push(
        `${agentId} skipped due to failures`
      );
      consciousness.update.updatePerformance(-0.1);
    }

    // Check for low confidence trend
    if (record.avgConfidence < 0.5 && record.executions >= 3) {
      const adjustment: StrategyAdjustment = {
        id: `adj_threshold_${agentId}_${Date.now()}`,
        type: 'threshold',
        description: `Lowered expectations for ${agentId} (avg confidence: ${record.avgConfidence.toFixed(2)})`,
        appliedAt: Date.now(),
        impact: 0,
      };

      this.adjustments.push(adjustment);
    }
  }

  private countConsecutiveFailures(results: boolean[]): number {
    let count = 0;
    for (let i = results.length - 1; i >= 0; i--) {
      if (!results[i]) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Recommend based on gaps
    for (const gap of this.gaps) {
      if (gap.severity > 0.7) {
        recommendations.push(gap.suggestedFix);
      }
    }

    // Recommend based on performance
    const poorPerformers = Array.from(this.agentPerformance.entries())
      .filter(
        ([_, record]) =>
          record.executions >= 2 && record.successes / record.executions < 0.5
      )
      .map(([id, _]) => id);

    if (poorPerformers.length > 0) {
      recommendations.push(
        `Consider reviewing agents: ${poorPerformers.join(', ')}`
      );
    }

    // Recommend based on adjustments made
    if (this.adjustments.length > 3) {
      recommendations.push(
        'Many adjustments made - consider redesigning pipeline'
      );
    }

    return recommendations;
  }
}

/**
 * Create a fresh session learner
 */
export function createSessionLearner(
  config: Partial<SessionLearnerConfig> = {}
): SessionLearner {
  return new SessionLearner(config);
}
