import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'node:crypto';
import { config } from '@consecom/config';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT = Buffer.from('consecom/provider-secrets/v1', 'utf8');

/**
 * Derive a per-purpose AES-256 key from the master key using HKDF-SHA256.
 * Different `info` → different key, even if derived from the same master.
 */
function deriveKey(info: string): Buffer {
  const master = Buffer.from(config.masterEncryptionKey, 'hex');
  if (master.length < 16) {
    throw new Error('MASTER_ENCRYPTION_KEY must be a hex string of >= 16 bytes');
  }
  // hkdfSync returns ArrayBuffer[]; first element is the derived key bytes.
  const derived = hkdfSync('sha256', master, SALT, Buffer.from(info, 'utf8'), KEY_LEN);
  return Buffer.from(derived as ArrayBuffer);
}

const CIPHER_KEY = deriveKey('cipher');

/**
 * Encrypt a provider API key for at-rest storage.
 * Output format: base64(iv ‖ ciphertext ‖ authTag)
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, CIPHER_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, authTag]).toString('base64');
}

/**
 * Decrypt a value previously produced by `encryptSecret`.
 * Throws if the ciphertext was tampered with (auth tag mismatch).
 */
export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  if (buf.length <= IV_LEN + 16) {
    throw new Error('ciphertext too short');
  }
  const iv = buf.subarray(0, IV_LEN);
  const authTag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(IV_LEN, buf.length - 16);
  const decipher = createDecipheriv(ALGO, CIPHER_KEY, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Show only the last 4 chars of a secret. Used in admin UIs and audit logs.
 */
export function hint(plaintext: string): string {
  return plaintext.slice(-4);
}