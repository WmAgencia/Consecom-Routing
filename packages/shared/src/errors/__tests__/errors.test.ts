import { describe, it, expect } from 'vitest';
import { ConsecomError, errors, ErrorCode } from '../index.js';

describe('ConsecomError', () => {
  it('toJSON serializes the public shape', () => {
    const e = errors.invalidRequest('bad input', { field: 'email' });
    expect(e).toBeInstanceOf(ConsecomError);
    expect(e.status).toBe(400);
    expect(e.code).toBe(ErrorCode.INVALID_REQUEST);
    const j = e.toJSON();
    expect(j.code).toBe('invalid_request');
    expect(j.message).toBe('bad input');
    expect(j.status).toBe(400);
    expect(j.details).toEqual({ field: 'email' });
  });

  it('error constructors return the right HTTP status', () => {
    expect(errors.unauthorized().status).toBe(401);
    expect(errors.forbidden().status).toBe(403);
    expect(errors.notFound().status).toBe(404);
    expect(errors.conflict('dup').status).toBe(409);
    expect(errors.rateLimited().status).toBe(429);
    expect(errors.paymentRequired().status).toBe(402);
    expect(errors.subscriptionExpired().status).toBe(402);
    expect(errors.insufficientCredits().status).toBe(402);
    expect(errors.internal().status).toBe(500);
    expect(errors.upstream().status).toBe(502);
    expect(errors.upstreamTimeout().status).toBe(504);
    expect(errors.provider().status).toBe(502);
  });
});
