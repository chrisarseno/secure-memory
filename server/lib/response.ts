/**
 * Standardized API response helpers
 * Provides consistent response format across all endpoints
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
  timestamp: string;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: SuccessResponse['meta'],
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  details?: any,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}

/**
 * Common error codes
 */
export const ErrorCode = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Domain-specific errors
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  MODULE_UPDATE_FAILED: 'MODULE_UPDATE_FAILED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  CONSCIOUSNESS_ERROR: 'CONSCIOUSNESS_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
