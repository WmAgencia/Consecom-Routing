import { eq } from 'drizzle-orm';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';
import type { ProviderAdapter } from '@consecom/shared';
import { config } from '@consecom/config';
import { AnthropicAdapter } from '../providers/anthropic/adapter.js';

/**
 * ProviderRegistry — owns the adapter instances.
 * Each adapter reads its API key from `provider_secrets` (decrypted at request
 * time, never logged, never returned).
 */
export class ProviderRegistry {
  private adapters = new Map<string, ProviderAdapter>();

  constructor(private db: Db) {
    // The Anthropic adapter uses ANTHROPIC_BASE_URL from env (defaults to
    // the official api.anthropic.com). The API key, however, is read from
    // the encrypted `provider_secrets` table so the front-end never sees it.
    this.adapters.set(
      'anthropic',
      new AnthropicAdapter(process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'),
    );
  }

  get(code: 'anthropic' | 'openai' | 'google' | 'groq'): ProviderAdapter {
    const a = this.adapters.get(code);
    if (!a) throw new Error(`provider not registered: ${code}`);
    return a;
  }

  /** Read and decrypt the provider's API key. Called once per request. */
  async getApiKey(providerCode: string): Promise<string> {
    const [provider] = await this.db
      .select()
      .from(s.providers)
      .where(eq(s.providers.code, providerCode as 'anthropic' | 'openai' | 'google' | 'groq'))
      .limit(1);
    if (!provider) throw new Error(`provider not found: ${providerCode}`);

    const [secret] = await this.db
      .select()
      .from(s.providerSecrets)
      .where(eq(s.providerSecrets.providerId, provider.id))
      .limit(1);

    if (secret) {
      // Decrypt the stored value.
      const { decryptSecret } = await import('./crypto.js');
      return decryptSecret(secret.encryptedKey);
    }

    // Fallback to env var (useful in dev when seed didn't write to provider_secrets).
    if (providerCode === 'anthropic') {
      if (!config.stripe.secretKey && !process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required when no provider_secret is stored');
      }
      return process.env.ANTHROPIC_API_KEY ?? '';
    }

    throw new Error(`no api key configured for provider ${providerCode}`);
  }
}
