import promClient from 'prom-client';
import { env } from './env';

// Create registry for metrics
export const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'nexus_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // Garbage collection buckets
});

// ===== HTTP Metrics =====

export const httpRequestDuration = new promClient.Histogram({
  name: 'nexus_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new promClient.Counter({
  name: 'nexus_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestSize = new promClient.Histogram({
  name: 'nexus_http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

export const httpResponseSize = new promClient.Histogram({
  name: 'nexus_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// ===== Consciousness Metrics =====

export const consciousnessCoherence = new promClient.Gauge({
  name: 'nexus_consciousness_coherence_percentage',
  help: 'Current consciousness coherence level (0-100)',
  registers: [register],
});

export const consciousnessModulesTotal = new promClient.Gauge({
  name: 'nexus_consciousness_modules_total',
  help: 'Total number of consciousness modules',
  labelNames: ['status'], // active, warning, error, offline
  registers: [register],
});

export const consciousnessIntegrationLevel = new promClient.Gauge({
  name: 'nexus_consciousness_integration_level',
  help: 'Average integration level across all modules',
  registers: [register],
});

// ===== AI System Metrics =====

export const aiRequestsTotal = new promClient.Counter({
  name: 'nexus_ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['model', 'status'], // status: success, error, timeout
  registers: [register],
});

export const aiRequestDuration = new promClient.Histogram({
  name: 'nexus_ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['model', 'type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const aiTokensProcessed = new promClient.Counter({
  name: 'nexus_ai_tokens_processed_total',
  help: 'Total number of tokens processed by AI models',
  labelNames: ['model', 'type'], // type: input, output
  registers: [register],
});

export const aiModelsAvailable = new promClient.Gauge({
  name: 'nexus_ai_models_available',
  help: 'Number of AI models currently available',
  labelNames: ['status'], // status: ready, loading, error
  registers: [register],
});

export const creativeIntelligence = new promClient.Gauge({
  name: 'nexus_creative_intelligence_percentage',
  help: 'Current creative intelligence level (0-100)',
  registers: [register],
});

// ===== Safety & Compliance Metrics =====

export const safetyCompliance = new promClient.Gauge({
  name: 'nexus_safety_compliance_percentage',
  help: 'Current safety compliance level (0-100)',
  registers: [register],
});

export const ethicalViolations = new promClient.Counter({
  name: 'nexus_ethical_violations_total',
  help: 'Total number of ethical violations detected',
  labelNames: ['severity'], // critical, high, medium, low
  registers: [register],
});

export const emergencyActionsTotal = new promClient.Counter({
  name: 'nexus_emergency_actions_total',
  help: 'Total number of emergency actions executed',
  labelNames: ['action_type'], // shutdown, restart, pause, etc.
  registers: [register],
});

// ===== Learning System Metrics =====

export const learningEfficiency = new promClient.Gauge({
  name: 'nexus_learning_efficiency_percentage',
  help: 'Current learning efficiency (0-100)',
  registers: [register],
});

export const knowledgeNodesTotal = new promClient.Gauge({
  name: 'nexus_knowledge_nodes_total',
  help: 'Total number of nodes in the knowledge graph',
  labelNames: ['type'], // concept, fact, experience, etc.
  registers: [register],
});

export const learningCyclesCompleted = new promClient.Counter({
  name: 'nexus_learning_cycles_completed_total',
  help: 'Total number of learning cycles completed',
  registers: [register],
});

export const knowledgeGapsResolved = new promClient.Counter({
  name: 'nexus_knowledge_gaps_resolved_total',
  help: 'Total number of knowledge gaps resolved',
  registers: [register],
});

// ===== Database Metrics =====

export const databaseQueryDuration = new promClient.Histogram({
  name: 'nexus_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'], // select, insert, update, delete
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const databaseConnectionsActive = new promClient.Gauge({
  name: 'nexus_database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

export const databaseConnectionsIdle = new promClient.Gauge({
  name: 'nexus_database_connections_idle',
  help: 'Number of idle database connections',
  registers: [register],
});

export const databaseQueriesTotal = new promClient.Counter({
  name: 'nexus_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'status'], // status: success, error
  registers: [register],
});

// ===== Cache Metrics =====

export const cacheHitsTotal = new promClient.Counter({
  name: 'nexus_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key_prefix'],
  registers: [register],
});

export const cacheMissesTotal = new promClient.Counter({
  name: 'nexus_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key_prefix'],
  registers: [register],
});

export const cacheKeysTotal = new promClient.Gauge({
  name: 'nexus_cache_keys_total',
  help: 'Total number of keys in cache',
  registers: [register],
});

export const cacheMemoryUsageBytes = new promClient.Gauge({
  name: 'nexus_cache_memory_usage_bytes',
  help: 'Memory usage of cache in bytes',
  registers: [register],
});

// ===== Collaboration Metrics =====

export const collaborationTasksTotal = new promClient.Counter({
  name: 'nexus_collaboration_tasks_total',
  help: 'Total number of AI collaboration tasks',
  labelNames: ['status'], // pending, active, completed, failed
  registers: [register],
});

export const collaborationAgentsActive = new promClient.Gauge({
  name: 'nexus_collaboration_agents_active',
  help: 'Number of active collaboration agents',
  registers: [register],
});

// ===== WebSocket Metrics =====

export const websocketConnectionsActive = new promClient.Gauge({
  name: 'nexus_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['authenticated'], // true, false
  registers: [register],
});

export const websocketMessagesTotal = new promClient.Counter({
  name: 'nexus_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction', 'event_type'], // direction: inbound, outbound
  registers: [register],
});

// ===== Cost Metrics =====

export const computeCostPerHour = new promClient.Gauge({
  name: 'nexus_compute_cost_per_hour_usd',
  help: 'Current compute cost per hour in USD',
  registers: [register],
});

export const totalComputeCost = new promClient.Counter({
  name: 'nexus_total_compute_cost_usd',
  help: 'Total compute cost in USD since startup',
  registers: [register],
});

// ===== Helper Functions =====

/**
 * Update consciousness metrics
 */
export function updateConsciousnessMetrics(metrics: {
  coherence: number;
  creativeIntelligence: number;
  safetyCompliance: number;
  learningEfficiency: number;
  modulesOnline: number;
  totalModules: number;
  costPerHour: number;
}) {
  consciousnessCoherence.set(metrics.coherence);
  creativeIntelligence.set(metrics.creativeIntelligence);
  safetyCompliance.set(metrics.safetyCompliance);
  learningEfficiency.set(metrics.learningEfficiency);
  consciousnessModulesTotal.set({ status: 'active' }, metrics.modulesOnline);
  consciousnessModulesTotal.set({ status: 'total' }, metrics.totalModules);
  computeCostPerHour.set(metrics.costPerHour);
}

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number,
  requestSize?: number,
  responseSize?: number
) {
  httpRequestDuration.observe({ method, route, status_code: statusCode }, duration / 1000);
  httpRequestsTotal.inc({ method, route, status_code: statusCode });

  if (requestSize) {
    httpRequestSize.observe({ method, route }, requestSize);
  }

  if (responseSize) {
    httpResponseSize.observe({ method, route }, responseSize);
  }
}

/**
 * Record AI request metrics
 */
export function recordAIRequest(
  model: string,
  duration: number,
  status: 'success' | 'error' | 'timeout',
  type: string = 'completion',
  tokensInput?: number,
  tokensOutput?: number
) {
  aiRequestsTotal.inc({ model, status });
  aiRequestDuration.observe({ model, type }, duration / 1000);

  if (tokensInput) {
    aiTokensProcessed.inc({ model, type: 'input' }, tokensInput);
  }

  if (tokensOutput) {
    aiTokensProcessed.inc({ model, type: 'output' }, tokensOutput);
  }
}

/**
 * Record database query metrics
 */
export function recordDatabaseQuery(
  operation: string,
  duration: number,
  status: 'success' | 'error'
) {
  databaseQueryDuration.observe({ operation }, duration / 1000);
  databaseQueriesTotal.inc({ operation, status });
}

/**
 * Update database connection pool metrics
 */
export function updateDatabasePoolMetrics(stats: {
  totalConnections: number;
  idleConnections: number;
}) {
  databaseConnectionsActive.set(stats.totalConnections - stats.idleConnections);
  databaseConnectionsIdle.set(stats.idleConnections);
}

/**
 * Record cache hit/miss
 */
export function recordCacheAccess(hit: boolean, keyPrefix: string) {
  if (hit) {
    cacheHitsTotal.inc({ cache_key_prefix: keyPrefix });
  } else {
    cacheMissesTotal.inc({ cache_key_prefix: keyPrefix });
  }
}

/**
 * Update cache metrics
 */
export function updateCacheMetrics(stats: { keys: number; memory: number }) {
  cacheKeysTotal.set(stats.keys);
  cacheMemoryUsageBytes.set(stats.memory);
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

/**
 * Get metrics content type
 */
export function getMetricsContentType(): string {
  return register.contentType;
}
