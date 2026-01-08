/**
 * Agent Pipeline
 *
 * Orchestrates multi-agent pipelines with handoffs, shared consciousness,
 * and within-session learning. The core of the Conscious Agent Framework.
 */

import {
  AgentDefinition,
  AgentInput,
  AgentOutput,
  PipelineDefinition,
  PipelineResult,
  PipelineMetrics,
  AgentResultEntry,
  ConsciousnessContext,
  HandoffContext,
  SessionMeta,
  SessionConfig,
  Learning,
  PipelineSignal,
} from './types';

import {
  createConsciousnessContext,
  applyLearnings,
} from './consciousness-context';

import {
  createInitialHandoff,
  createHandoff,
  validateHandoff,
  enrichHandoffWithConsciousness,
  shouldContinuePipeline,
} from './handoff-protocol';

import { createSessionLearner } from './session-learner';

export interface PipelineConfig {
  /** Session configuration */
  session: Partial<SessionConfig>;
  /** Enable within-session learning */
  enableLearning: boolean;
  /** Enable automatic retries */
  enableRetry: boolean;
  /** Maximum retries per agent */
  maxRetries: number;
  /** Timeout per agent (ms) */
  agentTimeout: number;
  /** Enable parallel execution where possible */
  enableParallel: boolean;
}

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  session: {
    maxAgents: 20,
    maxExecutionTime: 300000, // 5 minutes
    enableLearning: true,
    minConfidenceThreshold: 0.5,
  },
  enableLearning: true,
  enableRetry: true,
  maxRetries: 2,
  agentTimeout: 60000, // 1 minute
  enableParallel: false,
};

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAgents: 20,
  maxExecutionTime: 300000,
  enableLearning: true,
  minConfidenceThreshold: 0.5,
};

/**
 * Agent Pipeline - orchestrates multi-agent execution
 */
export class AgentPipeline {
  private agents: Map<string, AgentDefinition> = new Map();
  private pipelines: Map<string, PipelineDefinition> = new Map();
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
  }

  /**
   * Register an agent with the pipeline
   */
  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Register multiple agents
   */
  registerAgents(agents: AgentDefinition[]): void {
    agents.forEach((agent) => this.registerAgent(agent));
  }

  /**
   * Define a pipeline
   */
  definePipeline(pipeline: PipelineDefinition): void {
    // Validate that all agents exist
    for (const agentId of pipeline.agents) {
      if (!this.agents.has(agentId)) {
        throw new Error(
          `Pipeline ${pipeline.id} references unknown agent: ${agentId}`
        );
      }
    }
    this.pipelines.set(pipeline.id, pipeline);
  }

  /**
   * Execute a pipeline
   */
  async executePipeline(
    pipelineId: string,
    input: unknown,
    options: {
      initiator?: string;
      tags?: string[];
      costBudget?: number;
    } = {}
  ): Promise<PipelineResult> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const startTime = Date.now();
    const sessionId = this.generateSessionId();

    // Initialize session
    const sessionMeta: SessionMeta = {
      sessionId,
      startTime,
      originalInput: input,
      initiator: options.initiator || 'system',
      tags: options.tags || [],
      config: {
        ...DEFAULT_SESSION_CONFIG,
        ...this.config.session,
        costBudget: options.costBudget,
      },
    };

    // Initialize consciousness context
    const consciousness = createConsciousnessContext(
      sessionId,
      typeof input === 'string' ? input : JSON.stringify(input).slice(0, 100)
    );

    // Initialize session learner
    const learner = createSessionLearner({
      enableAutoAdjust: this.config.enableLearning,
    });

    // Initialize handoff
    let handoff = createInitialHandoff(pipeline.agents[0], input, {
      priority: 'medium',
    });

    const results: AgentResultEntry[] = [];
    const allLearnings: Learning[] = [];
    let currentAgentIndex = 0;
    let finalOutput: unknown = null;
    let success = true;

    // Execute pipeline
    while (currentAgentIndex < pipeline.agents.length) {
      // Check pipeline health
      const healthCheck = shouldContinuePipeline(
        handoff,
        sessionMeta.config.minConfidenceThreshold
      );
      if (!healthCheck.continue) {
        console.log(`Pipeline halted: ${healthCheck.reason}`);
        success = false;
        break;
      }

      // Check session limits
      if (Date.now() - startTime > sessionMeta.config.maxExecutionTime) {
        console.log('Pipeline halted: execution time exceeded');
        success = false;
        break;
      }

      if (results.length >= sessionMeta.config.maxAgents) {
        console.log('Pipeline halted: max agents reached');
        success = false;
        break;
      }

      // Get current agent
      const agentId = pipeline.agents[currentAgentIndex];

      // Check if learner says to skip
      if (learner.shouldSkipAgent(agentId)) {
        console.log(`Skipping agent ${agentId} (learner recommendation)`);
        currentAgentIndex++;
        continue;
      }

      // Check for routing override
      const override = learner.getRoutingOverride(agentId);
      const effectiveAgentId = override || agentId;

      const agent = this.agents.get(effectiveAgentId);
      if (!agent) {
        console.error(`Agent not found: ${effectiveAgentId}`);
        currentAgentIndex++;
        continue;
      }

      // Update handoff target
      handoff.toAgent = effectiveAgentId;

      // Validate handoff
      const validation = validateHandoff(handoff);
      if (!validation.valid) {
        console.error(`Invalid handoff: ${validation.issues.join(', ')}`);
        success = false;
        break;
      }

      // Enrich handoff with consciousness
      handoff = enrichHandoffWithConsciousness(handoff, consciousness);

      // Call before hook
      if (pipeline.hooks?.beforeAgent) {
        await pipeline.hooks.beforeAgent(effectiveAgentId, handoff);
      }

      // Execute agent
      let output: AgentOutput;
      try {
        output = await this.executeAgent(
          agent,
          handoff,
          sessionMeta,
          consciousness
        );
      } catch (error) {
        console.error(`Agent ${effectiveAgentId} failed:`, error);

        // Create failure output
        output = {
          result: null,
          success: false,
          confidence: 0,
          learnings: [
            {
              id: `error_${effectiveAgentId}_${Date.now()}`,
              type: 'failure_pattern',
              content: `Agent ${effectiveAgentId} threw error: ${error instanceof Error ? error.message : 'Unknown'}`,
              source: effectiveAgentId,
              confidence: 1,
              timestamp: Date.now(),
              actionable: true,
            },
          ],
          signals: ['continue'],
          metrics: {
            executionTimeMs: 0,
            retryCount: 0,
          },
        };
      }

      // Record execution with learner
      learner.recordExecution(effectiveAgentId, output, consciousness);

      // Call after hook
      if (pipeline.hooks?.afterAgent) {
        await pipeline.hooks.afterAgent(effectiveAgentId, output, handoff);
      }

      // Store result
      results.push({
        agentId: effectiveAgentId,
        success: output.success,
        confidence: output.confidence,
        executionTime: output.metrics.executionTimeMs,
        output: output.result,
      });

      // Collect learnings
      allLearnings.push(...output.learnings);
      applyLearnings(consciousness, output.learnings);

      // Update final output
      finalOutput = output.result;

      // Process signals
      const signal = this.processSignals(output.signals);
      if (signal === 'halt') {
        console.log('Pipeline halted by agent signal');
        break;
      }
      if (signal === 'skip_next') {
        currentAgentIndex += 2;
        continue;
      }

      // Handle explicit next agent
      if (output.nextAgent) {
        const nextIndex = pipeline.agents.indexOf(output.nextAgent);
        if (nextIndex !== -1) {
          currentAgentIndex = nextIndex;
        } else {
          // Agent not in pipeline, try to execute directly
          const nextAgent = this.agents.get(output.nextAgent);
          if (nextAgent) {
            handoff = createHandoff(
              effectiveAgentId,
              output.nextAgent,
              handoff,
              output,
              output.metrics.executionTimeMs
            );
            continue;
          }
        }
      }

      // Create handoff for next agent
      const nextAgentId = pipeline.agents[currentAgentIndex + 1];
      if (nextAgentId) {
        handoff = createHandoff(
          effectiveAgentId,
          nextAgentId,
          handoff,
          output,
          output.metrics.executionTimeMs
        );
      }

      currentAgentIndex++;
    }

    // Generate session learnings
    const sessionLearnings = learner.generateSessionLearnings();
    allLearnings.push(...sessionLearnings);

    // Calculate metrics
    const metrics = this.calculateMetrics(results, allLearnings);

    // Build result
    const pipelineResult: PipelineResult = {
      pipelineId,
      sessionId,
      success: success && results.some((r) => r.success),
      agentResults: results,
      totalExecutionTime: Date.now() - startTime,
      learnings: allLearnings,
      finalOutput,
      metrics,
    };

    // Call completion hook
    if (pipeline.hooks?.onComplete) {
      await pipeline.hooks.onComplete(pipelineResult);
    }

    return pipelineResult;
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(
    agent: AgentDefinition,
    handoff: HandoffContext,
    sessionMeta: SessionMeta,
    consciousness: ConsciousnessContext
  ): Promise<AgentOutput> {
    const startTime = Date.now();
    let retryCount = 0;

    // Update consciousness attention
    consciousness.update.attend({
      id: `agent_${agent.id}_${Date.now()}`,
      content: `Executing ${agent.name}`,
      priority: 0.9,
      source: 'pipeline',
      timestamp: Date.now(),
    });

    // Update consciousness phase
    consciousness.session.currentPhase = `executing_${agent.id}`;

    // Prepare input
    const input: AgentInput = {
      payload: handoff.payload,
      handoffContext: handoff,
      sessionMeta,
    };

    // Execute with retry logic
    while (retryCount <= this.config.maxRetries) {
      try {
        // Execute with timeout
        const result = await Promise.race([
          agent.execute(input, consciousness),
          this.createTimeout(this.config.agentTimeout),
        ]);

        // Update execution metrics
        result.metrics = {
          ...result.metrics,
          executionTimeMs: Date.now() - startTime,
          retryCount,
        };

        // Record temporal event
        consciousness.update.recordEvent({
          type: 'agent_execution',
          content: {
            agentId: agent.id,
            success: result.success,
            confidence: result.confidence,
          },
          timestamp: Date.now(),
          significance: result.success ? 0.7 : 0.9,
          decayRate: 0.1,
        });

        return result;
      } catch (error) {
        retryCount++;
        console.warn(
          `Agent ${agent.id} attempt ${retryCount} failed:`,
          error instanceof Error ? error.message : error
        );

        if (retryCount > this.config.maxRetries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, retryCount) * 1000);
      }
    }

    // Should never reach here
    throw new Error(`Agent ${agent.id} exceeded retry limit`);
  }

  /**
   * Process agent signals
   */
  private processSignals(signals: PipelineSignal[]): PipelineSignal | null {
    // Priority: halt > skip_next > retry > continue
    if (signals.includes('halt')) return 'halt';
    if (signals.includes('skip_next')) return 'skip_next';
    if (signals.includes('retry')) return 'retry';
    return 'continue';
  }

  /**
   * Calculate pipeline metrics
   */
  private calculateMetrics(
    results: AgentResultEntry[],
    learnings: Learning[]
  ): PipelineMetrics {
    const successful = results.filter((r) => r.success).length;
    const avgConfidence =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0;

    return {
      totalAgentsRun: results.length,
      successfulAgents: successful,
      failedAgents: results.length - successful,
      totalTokens: 0, // Would need to be tracked in AgentOutput
      totalCost: 0, // Would need to be tracked in AgentOutput
      averageConfidence: avgConfidence,
      learningsGenerated: learnings.length,
    };
  }

  /**
   * Get registered agents
   */
  getAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get defined pipelines
   */
  getPipelines(): PipelineDefinition[] {
    return Array.from(this.pipelines.values());
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a new pipeline instance
 */
export function createPipeline(
  config: Partial<PipelineConfig> = {}
): AgentPipeline {
  return new AgentPipeline(config);
}

/**
 * Helper to create an agent definition
 */
export function defineAgent(
  id: string,
  name: string,
  description: string,
  capabilities: string[],
  execute: AgentDefinition['execute'],
  canHandle?: AgentDefinition['canHandle']
): AgentDefinition {
  return {
    id,
    name,
    description,
    capabilities,
    execute,
    canHandle,
  };
}

/**
 * Helper to create a simple pipeline definition
 */
export function definePipelineFlow(
  id: string,
  name: string,
  agents: string[],
  hooks?: PipelineDefinition['hooks']
): PipelineDefinition {
  return {
    id,
    name,
    description: `Pipeline: ${name}`,
    agents,
    hooks,
  };
}
