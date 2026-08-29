import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRateLimiter } from '../rate-limit.js';

describe('InMemoryRateLimiter', () => {
  let limiter: InMemoryRateLimiter;
  let now: number;

  beforeEach(() => {
    now = 1_700_000_000_000;
    limiter = new InMemoryRateLimiter(60_000, () => now);
  });

  it('allows the first N requests within the window', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await limiter.consume('k', 5, 60_000);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(4 - i);
    }
  });

  it('rejects when the limit is hit', async () => {
    for (let i = 0; i < 5; i++) await limiter.consume('k', 5, 60_000);
    const r = await limiter.consume('k', 5, 60_000);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('releases capacity as the window slides', async () => {
    for (let i = 0; i < 5; i++) await limiter.consume('k', 5, 60_000);
    now += 30_000; // halfway
    const r = await limiter.consume('k', 5, 60_000);
    expect(r.allowed).toBe(false); // still inside window

    now += 31_000; // past the window
    const r2 = await limiter.consume('k', 5, 60_000);
    expect(r2.allowed).toBe(true);
  });

  it('isolates keys', async () => {
    for (let i = 0; i < 5; i++) await limiter.consume('a', 5, 60_000);
    const r = await limiter.consume('b', 5, 60_000);
    expect(r.allowed).toBe(true);
  });
});
