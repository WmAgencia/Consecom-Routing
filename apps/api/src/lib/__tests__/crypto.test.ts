import { describe, it, expect, beforeAll } from 'vitest';

// Set the master encryption key BEFORE importing the module under test.
process.env.MASTER_ENCRYPTION_KEY =
  '4e7a1c2b8f9d3e6a5c1b7d4e2f8a9c3b6d5e1f7a8c2b9d4e3f6a1c5b8d2e9f4a7';

const { encryptSecret, decryptSecret, hint } = await import('../crypto.js');

describe('crypto AES-256-GCM', () => {
  it('roundtrips a plaintext', () => {
    const ct = encryptSecret('hello world');
    expect(ct).not.toContain('hello world');
    expect(decryptSecret(ct)).toBe('hello world');
  });

  it('produces different ciphertext for the same plaintext', () => {
    const a = encryptSecret('same input');
    const b = encryptSecret('same input');
    expect(a).not.toBe(b);
  });

  it('throws when ciphertext is tampered', () => {
    const ct = encryptSecret('something');
    const buf = Buffer.from(ct, 'base64');
    const idx = buf.length - 5;
    buf[idx] = (buf[idx] ?? 0) ^ 0xff;
    const tampered = buf.toString('base64');
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('hint() returns the last 4 chars', () => {
    expect(hint('sk-nx-04ef6058344e7660')).toBe('7660');
  });
});
