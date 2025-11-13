import { z } from 'zod';

/**
 * Environment variable schema with strict validation
 */
const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server Configuration
  PORT: z.string().default('5000').transform(Number),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters for security')
    .default('nexus-dev-secret-change-in-production-please-use-strong-secret'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Optional AI Configuration
  OPENAI_API_KEY: z.string().optional(),
  OLLAMA_HOST: z.string().url().default('http://localhost:11434'),

  // Optional Cache Configuration
  REDIS_URL: z.string().url().optional(),
  ENABLE_REDIS_CACHE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Optional Monitoring
  SENTRY_DSN: z.string().url().optional(),

  // Optional Feature Flags
  ENABLE_DISTRIBUTED_SYSTEM: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  ENABLE_ADVANCED_AI: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Throws error on startup if validation fails
 */
export const env = (() => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  // Warn about default secrets in production
  if (result.data.NODE_ENV === 'production') {
    if (result.data.SESSION_SECRET.includes('nexus-dev-secret')) {
      console.warn('⚠️  WARNING: Using default SESSION_SECRET in production!');
    }
    if (!result.data.OPENAI_API_KEY && !result.data.OLLAMA_HOST) {
      console.warn('⚠️  WARNING: No AI service configured (OPENAI_API_KEY or OLLAMA_HOST)');
    }
  }

  console.log('✅ Environment variables validated successfully');
  return result.data;
})();
