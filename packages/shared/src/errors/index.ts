/**
 * Standard error codes returned by the API.
 * Each error includes a stable `code`, human `message`, and HTTP `status`.
 * The `request_id` is added automatically by the Fastify error handler.
 */
export const ErrorCode = {
  // 400-class — client errors
  INVALID_REQUEST: 'invalid_request',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  VALIDATION_FAILED: 'validation_failed',
  RATE_LIMITED: 'rate_limited',

  // 402 — payment / credits
  PAYMENT_REQUIRED: 'payment_required',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  INSUFFICIENT_CREDITS: 'insufficient_credits',

  // 5xx — server errors
  INTERNAL: 'internal_error',
  UPSTREAM_ERROR: 'upstream_error',
  UPSTREAM_TIMEOUT: 'upstream_timeout',
  PROVIDER_ERROR: 'provider_error',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiError {
  code: ErrorCodeValue;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  request_id?: string;
}

export class ConsecomError extends Error {
  code: ErrorCodeValue;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCodeValue,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ConsecomError';
    this.code = code;
    this.status = status;
    if (details !== undefined) this.details = details;
  }

  toJSON(): ApiError {
    const out: ApiError = {
      code: this.code,
      message: this.message,
      status: this.status,
    };
    if (this.details !== undefined) out.details = this.details;
    return out;
  }
}

// Convenience constructors
export const errors = {
  invalidRequest: (msg = 'Invalid request', details?: Record<string, unknown>) =>
    new ConsecomError(ErrorCode.INVALID_REQUEST, msg, 400, details),
  unauthorized: (msg = 'Unauthorized') =>
    new ConsecomError(ErrorCode.UNAUTHORIZED, msg, 401),
  forbidden: (msg = 'Forbidden') =>
    new ConsecomError(ErrorCode.FORBIDDEN, msg, 403),
  notFound: (msg = 'Not found') =>
    new ConsecomError(ErrorCode.NOT_FOUND, msg, 404),
  conflict: (msg: string) =>
    new ConsecomError(ErrorCode.CONFLICT, msg, 409),
  validation: (msg: string, details?: Record<string, unknown>) =>
    new ConsecomError(ErrorCode.VALIDATION_FAILED, msg, 400, details),
  rateLimited: (msg = 'Rate limit exceeded', details?: Record<string, unknown>) =>
    new ConsecomError(ErrorCode.RATE_LIMITED, msg, 429, details),
  paymentRequired: (msg = 'Payment required') =>
    new ConsecomError(ErrorCode.PAYMENT_REQUIRED, msg, 402),
  subscriptionExpired: (msg = 'Subscription has expired') =>
    new ConsecomError(ErrorCode.SUBSCRIPTION_EXPIRED, msg, 402),
  insufficientCredits: (msg = 'Insufficient credits') =>
    new ConsecomError(ErrorCode.INSUFFICIENT_CREDITS, msg, 402),
  internal: (msg = 'Internal server error') =>
    new ConsecomError(ErrorCode.INTERNAL, msg, 500),
  upstream: (msg = 'Upstream provider error', details?: Record<string, unknown>) =>
    new ConsecomError(ErrorCode.UPSTREAM_ERROR, msg, 502, details),
  upstreamTimeout: (msg = 'Upstream provider timeout') =>
    new ConsecomError(ErrorCode.UPSTREAM_TIMEOUT, msg, 504),
  provider: (msg = 'Provider error', details?: Record<string, unknown>) =>
    new ConsecomError(ErrorCode.PROVIDER_ERROR, msg, 502, details),
} as const;
