# Conscious Agent Framework

A TypeScript framework for building multi-agent pipelines with:

- **Structured Handoffs** - Pass context, learnings, and state between agents
- **Shared Consciousness** - Agents share awareness, attention, and temporal memory
- **Within-Session Learning** - Adapt strategies mid-run based on performance

## Installation

```bash
npm install conscious-agents
```

## Quick Start

```typescript
import {
  createPipeline,
  defineAgent,
  definePipelineFlow,
  AgentInput,
  ConsciousnessContext,
} from 'conscious-agents';

// 1. Define your agents
const trendScout = defineAgent(
  'trend-scout',
  'Trend Scout',
  'Identifies trending topics and opportunities',
  ['trend-detection', 'data-analysis'],
  async (input: AgentInput, consciousness: ConsciousnessContext) => {
    // Your trend detection logic here
    const trends = await detectTrends(input.payload);

    return {
      result: { trends },
      success: true,
      confidence: 0.85,
      learnings: [{
        id: 'trend-learning-1',
        type: 'insight',
        content: 'Tech trends are hot right now',
        source: 'trend-scout',
        confidence: 0.9,
        timestamp: Date.now(),
        actionable: true,
      }],
      signals: ['continue'],
      metrics: { executionTimeMs: 1200, retryCount: 0 }
    };
  }
);

const contentCreator = defineAgent(
  'content-creator',
  'Content Creator',
  'Creates content based on trends',
  ['content-generation', 'creative-writing'],
  async (input: AgentInput, consciousness: ConsciousnessContext) => {
    // Access learnings from previous agents
    const trends = input.handoffContext.learnings
      .filter(l => l.source === 'trend-scout');

    // Use consciousness for context
    console.log('Current focus:', consciousness.attention.focus);

    const content = await generateContent(input.payload);

    return {
      result: { content },
      success: true,
      confidence: 0.9,
      learnings: [],
      signals: ['continue'],
      metrics: { executionTimeMs: 2000, retryCount: 0 }
    };
  }
);

// 2. Create and configure pipeline
const pipeline = createPipeline({
  enableLearning: true,
  enableRetry: true,
  maxRetries: 2,
});

// 3. Register agents
pipeline.registerAgents([trendScout, contentCreator]);

// 4. Define pipeline flow
pipeline.definePipeline(definePipelineFlow(
  'content-pipeline',
  'Content Creation Pipeline',
  ['trend-scout', 'content-creator'],
  {
    beforeAgent: async (agentId, context) => {
      console.log(`Starting ${agentId}...`);
    },
    afterAgent: async (agentId, output, context) => {
      console.log(`${agentId} completed with confidence ${output.confidence}`);
    },
    onComplete: async (result) => {
      console.log(`Pipeline complete! ${result.metrics.successfulAgents} agents succeeded`);
    }
  }
));

// 5. Execute
const result = await pipeline.executePipeline('content-pipeline', {
  topic: 'AI trends',
  targetAudience: 'developers'
});

console.log('Final output:', result.finalOutput);
console.log('Learnings generated:', result.learnings.length);
```

## Core Concepts

### Agents

Agents are the building blocks. Each agent:
- Has a specific mission/capability
- Receives input + handoff context + consciousness
- Returns result + learnings + signals

```typescript
const myAgent = defineAgent(
  'my-agent',           // id
  'My Agent',           // name
  'Does something',     // description
  ['capability-1'],     // capabilities
  async (input, consciousness) => {
    // Your logic here
    return { result, success, confidence, learnings, signals, metrics };
  }
);
```

### Handoffs

When one agent completes, it hands off to the next with:
- The result payload
- Accumulated learnings
- Trail of previous agents
- Priority and deadline info

```typescript
// Handoff context available to each agent
interface HandoffContext {
  handoffId: string;
  fromAgent: string | null;
  toAgent: string;
  payload: unknown;
  learnings: Learning[];
  agentTrail: AgentTrailEntry[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  deadline?: number;
}
```

### Consciousness

Shared awareness across all agents in a session:

```typescript
interface ConsciousnessContext {
  session: SessionState;      // Session-level state
  attention: AttentionState;  // Current focus
  temporal: TemporalState;    // Memory across timescales
  socialModels: Map<string, AgentModel>;  // Models of other agents
  values: ValueState;         // Goals and constraints
  update: ConsciousnessUpdater;  // Methods to update state
}

// Use in your agent:
async (input, consciousness) => {
  // Check what we're focused on
  console.log(consciousness.attention.focus);

  // See what's worked before
  console.log(consciousness.session.successPatterns);

  // Record an event
  consciousness.update.recordEvent({
    type: 'important_discovery',
    content: { data: 'something important' },
    timestamp: Date.now(),
    significance: 0.9,
    decayRate: 0.1
  });

  // Update agent model
  consciousness.update.updateAgentModel('other-agent', {
    trust: 0.9,
    performanceHistory: [0.8, 0.9, 0.85]
  });
}
```

### Session Learning

The framework tracks performance and adapts mid-run:

- **Gap Detection**: Identifies when agents are struggling
- **Strategy Adjustment**: Skips failing agents, adjusts routing
- **Learning Generation**: Creates learnings from session performance

```typescript
// Enable learning in pipeline config
const pipeline = createPipeline({
  enableLearning: true,
  session: {
    minConfidenceThreshold: 0.5,  // Stop if confidence drops below this
  }
});

// Access learner state
const learnerState = learner.getState();
console.log('Performance trend:', learnerState.performanceTrend);
console.log('Recommendations:', learnerState.recommendedActions);
```

## API Reference

### Pipeline

```typescript
// Create pipeline
const pipeline = createPipeline(config?: PipelineConfig);

// Register agents
pipeline.registerAgent(agent: AgentDefinition);
pipeline.registerAgents(agents: AgentDefinition[]);

// Define pipeline flow
pipeline.definePipeline(definition: PipelineDefinition);

// Execute
const result = await pipeline.executePipeline(
  pipelineId: string,
  input: unknown,
  options?: { initiator?: string; tags?: string[]; costBudget?: number }
);
```

### Agent Output Signals

Agents can signal pipeline behavior:

```typescript
signals: [
  'continue',    // Continue to next agent (default)
  'skip_next',   // Skip the next agent
  'halt',        // Stop the pipeline
  'retry',       // Retry this agent
  'escalate',    // Escalate to human review
  'branch',      // Branch to different pipeline
]
```

### Learnings

Agents can generate learnings that persist across the pipeline:

```typescript
const learning: Learning = {
  id: 'unique-id',
  type: 'success_pattern' | 'failure_pattern' | 'insight' | 'strategy' | 'correction' | 'optimization',
  content: 'What was learned',
  source: 'agent-id',
  confidence: 0.9,
  timestamp: Date.now(),
  actionable: true,
  domain: 'optional-domain',
};
```

## Use Cases

### Content Production Pipeline

```typescript
['trend-scout', 'content-planner', 'content-creator', 'quality-checker', 'publisher']
```

### Research Pipeline

```typescript
['query-analyzer', 'source-gatherer', 'fact-checker', 'synthesizer', 'reviewer']
```

### Customer Support Pipeline

```typescript
['intent-classifier', 'knowledge-retriever', 'response-generator', 'tone-checker', 'escalation-detector']
```

## License

MIT
