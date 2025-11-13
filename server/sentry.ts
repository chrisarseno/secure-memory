import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env';
import type { Express } from 'express';

// Initialize Sentry (only if DSN is configured)
export function initializeSentry() {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.log('📊 Sentry not configured (SENTRY_DSN not set)');
    return false;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: env.NODE_ENV,

      // Performance monitoring
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

      integrations: [
        // Profiling for performance insights
        nodeProfilingIntegration(),
      ],

      // Add custom context before sending
      beforeSend(event, hint) {
        // Add NEXUS-specific context
        if (hint.originalException) {
          event.contexts = {
            ...event.contexts,
            nexus: {
              environment: env.NODE_ENV,
              timestamp: new Date().toISOString(),
            },
          };
        }

        // Filter out sensitive data from request bodies
        if (event.request?.data) {
          const data = event.request.data as Record<string, any>;
          const sanitized = { ...data };

          // Remove sensitive fields
          ['password', 'token', 'secret', 'apiKey', 'sessionId'].forEach(field => {
            if (sanitized[field]) {
              sanitized[field] = '[REDACTED]';
            }
          });

          event.request.data = sanitized;
        }

        return event;
      },

      // Don't send certain errors to Sentry
      ignoreErrors: [
        // Ignore known benign errors
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'Non-Error promise rejection captured',
      ],
    });

    console.log('✅ Sentry initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    return false;
  }
}

// Express middleware for Sentry
export function setupSentryMiddleware(app: Express) {
  // Request handler must be the first middleware
  app.use(Sentry.setupExpressErrorHandler(app));
}

// Error handler middleware (must be added AFTER all routes)
export function setupSentryErrorHandler(app: Express) {
  // Error handler is already set up in setupSentryMiddleware
  // This function is kept for API compatibility but does nothing
}

// Manual error capture with context
export function captureException(error: Error, context?: {
  tags?: Record<string, string>;
  level?: Sentry.SeverityLevel;
  user?: {
    id?: string;
    username?: string;
  };
  extra?: Record<string, any>;
}) {
  if (context) {
    Sentry.captureException(error, {
      tags: context.tags,
      level: context.level || 'error',
      user: context.user,
      extra: context.extra,
    });
  } else {
    Sentry.captureException(error);
  }
}

// Capture custom messages (not errors)
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Add breadcrumb for debugging context
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Set user context
export function setUser(user: {
  id: string;
  username?: string;
  email?: string;
}) {
  Sentry.setUser(user);
}

// Clear user context (e.g., on logout)
export function clearUser() {
  Sentry.setUser(null);
}

// Flush events (useful for serverless or before process exit)
export async function flushSentry(timeout = 2000): Promise<boolean> {
  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    console.error('Error flushing Sentry:', error);
    return false;
  }
}

// Transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({
    name,
    op,
  }, () => {
    // Span logic here
  });
}

// Export Sentry for advanced usage
export { Sentry };
