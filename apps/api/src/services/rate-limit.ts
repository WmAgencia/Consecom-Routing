import type { RateLimiterPort, RateLimitResult } from '@consecom/shared';

/**
 * In-memory sliding-window rate limiter.
 *
 * Holds a list of request timestamps per key; on `consume`, drops timestamps
 * older than `windowMs` and checks if the remaining count is below `limit`.
 *
 * Trade-offs (MVP):
 *  - State is per-process — not shared across instances.
 *  - State is lost on restart. A few seconds of allowance loss is acceptable
 *    on a deploy for an MVP; replace with Redis when horizontal scaling kicks in.
 *
 * To swap: implement the same `RateLimiterPort` against Redis and bind it
 * in `apps/api/src/lib/provider-registry.ts`. The API routes don't change.
 */
export class InMemoryRateLimiter implements RateLimiterPort {
  private buckets = new Map<string, number[]>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly cleanupIntervalMs = 60_000,
    private readonly now: () => number = () => Date.now(),
  ) {
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.sweep(), this.cleanupIntervalMs);
      // Don't keep the process alive just for cleanup
      this.cleanupInterval.unref?.();
    }
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = this.now();
    const cutoff = now - windowMs;
    const existing = this.buckets.get(key) ?? [];

    // Drop entries outside the window (in-place to avoid extra allocations).
    let drop = 0;
    while (drop < existing.length && existing[drop]! < cutoff) drop++;
    const recent = drop > 0 ? existing.slice(drop) : existing;

    if (recent.length >= limit) {
      const oldest = recent[0]!;
      const resetMs = Math.max(0, oldest + windowMs - now);
      this.buckets.set(key, recent);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
        retryAfterMs: resetMs,
      };
    }

    recent.push(now);
    this.buckets.set(key, recent);
    return {
      allowed: true,
      remaining: Math.max(0, limit - recent.length),
      resetMs: windowMs,
    };
  }

  /** Drop empty buckets to bound memory. Called periodically. */
  private sweep(): void {
    const now = this.now();
    for (const [key, timestamps] of this.buckets) {
      const cutoff = now - 5 * 60_000; // anything older than 5min is stale
      const live = timestamps.filter((t) => t >= cutoff);
      if (live.length === 0) this.buckets.delete(key);
      else if (live.length !== timestamps.length) this.buckets.set(key, live);
    }
  }

  /** Test helper — wipes all state. */
  reset(): void {
    this.buckets.clear();
  }

  /** Stop the background cleanup. Call on shutdown. */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
