import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/db-schema";
import { env } from "./env";
import pino from "pino";

// Initialize logger for database operations
const logger = pino({
  level: env.LOG_LEVEL,
});

neonConfig.webSocketConstructor = ws;

// Configure connection pool with optimal settings
export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  // Connection pool configuration
  max: 20, // Maximum number of connections in the pool
  min: 5,  // Minimum number of connections to keep alive

  // Timeout configuration
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 5000,  // Wait 5s max for new connection

  // Connection lifecycle
  maxUses: 7500, // Close connections after 7500 uses (prevent memory leaks)
  allowExitOnIdle: true, // Allow process to exit if all connections are idle
});

// Connection health monitoring
pool.on('error', (err, client) => {
  logger.error({ err, client: client ? 'active' : 'idle' }, '❌ Unexpected database pool error');
});

pool.on('connect', (client) => {
  logger.debug('✅ New database connection established');
});

pool.on('acquire', (client) => {
  logger.debug('🔒 Database connection acquired from pool');
});

pool.on('remove', (client) => {
  logger.debug('🗑️  Database connection removed from pool');
});

// Query logging and performance monitoring
let slowQueryThreshold = 100; // Log queries taking more than 100ms

export const db = drizzle({
  client: pool,
  schema,
  logger: {
    logQuery(query: string, params: unknown[]) {
      const start = Date.now();

      return () => {
        const duration = Date.now() - start;

        if (duration > slowQueryThreshold) {
          logger.warn(
            {
              query: query.substring(0, 200), // Truncate long queries
              duration,
              params: params.length,
            },
            '🐌 Slow database query detected'
          );
        } else {
          logger.debug(
            {
              query: query.substring(0, 100),
              duration,
            },
            'Database query executed'
          );
        }
      };
    },
  },
});

// Pool statistics helper
export async function getPoolStats() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
  };
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.debug('✅ Database health check passed');
    return true;
  } catch (error) {
    logger.error({ error }, '❌ Database health check failed');
    return false;
  }
}

// Graceful shutdown function
export async function closeDatabasePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('✅ Database connection pool closed');
  } catch (error) {
    logger.error({ error }, '❌ Error closing database pool');
    throw error;
  }
}
