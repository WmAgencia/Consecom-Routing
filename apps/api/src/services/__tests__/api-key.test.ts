import { describe, it, expect } from 'vitest';
import { extractBearer } from '../api-key.js';

describe('ApiKeyService.extractBearer', () => {
  it('extracts the token from a Bearer header', () => {
    expect(extractBearer('Bearer sk-xxx')).toBe('sk-xxx');
    expect(extractBearer('bearer sk-yyy')).toBe('sk-yyy');
    expect(extractBearer('BEARER sk-zzz')).toBe('sk-zzz');
  });

  it('returns null for malformed headers', () => {
    expect(extractBearer(undefined)).toBeNull();
    expect(extractBearer('')).toBeNull();
    expect(extractBearer('Basic abc')).toBeNull();
    expect(extractBearer('Bearer')).toBeNull();
    expect(extractBearer('Bearer ')).toBeNull();
  });
});
