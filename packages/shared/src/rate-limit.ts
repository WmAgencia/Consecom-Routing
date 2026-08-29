/**
 * RateLimiterPort — the abstraction over rate limit storage.
 * The MVP uses an in-memory sliding window; a Redis-backed implementation
 * can be swapped in without touching the API routes.
 */
export interface RateLimiterPort {
  /**
   * Try to consume one token from the bucket. Returns whether the call is allowed,
   * how many tokens remain in the current window, and when the window resets.
   */
  consume(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitResult>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterMs?: number;
}
