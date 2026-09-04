import { eq } from 'drizzle-orm';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';
import type { ProviderAdapter } from '@consecom/shared';
import { config } from '@consecom/config';
import { AnthropicAdapter } from '../providers/anthropic/adapter.js';
import { OpenRouterAdapter } from '../providers/openrouter/adapter.js';
import { PuterAdapter } from '../providers/puter/adapter.js';
import { PoyoAdapter } from '../providers/poyo/adapter.js';

/**
 * ProviderRegistry — owns the adapter instances.
 * Each adapter reads its API key from `provider_secrets` (decrypted at request
 * time, never logged, never returned).
 */
export class ProviderRegistry {
  private adapters = new Map<string, ProviderAdapter>();

  constructor(private db: Db) {
    // Anthropic: uses ANTHROPIC_BASE_URL from env (defaults to api.anthropic.com).
    // The API key is read from the encrypted `provider_secrets` table.
    this.adapters.set(
      'anthropic',
      new AnthropicAdapter(process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'),
    );

    // OpenRouter: OpenAI-compatible gateway with ~5% markup.
    this.adapters.set(
      'openrouter',
      new OpenRouterAdapter(
        process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
      ),
    );

    // Puter: User-Pays model (each user pays from their own Puter account).
    this.adapters.set(
      'puter',
      new PuterAdapter(process.env.PUTER_API_BASE_URL ?? 'https://api.puter.com'),
    );

    // PoyoAPI: Third-party provider with 60% discount on Claude Opus 5.
    this.adapters.set(
      'poyo',
      new PoyoAdapter(process.env.POYO_API_BASE_URL ?? 'https://api.poyo.ai'),
    );
  }

  get(code: 'anthropic' | 'openrouter' | 'openai' | 'google' | 'groq' | 'puter' | 'poyo'): ProviderAdapter {
    const a = this.adapters.get(code);
    if (!a) throw new Error(`provider not registered: ${code}`);
    return a;
  }

  /** Read and decrypt the provider's API key. Called once per request. */
  async getApiKey(
    providerCode: 'anthropic' | 'openrouter' | 'openai' | 'google' | 'groq' | 'puter' | 'poyo',
  ): Promise<string> {
    const [provider] = await this.db
      .select()
      .from(s.providers)
      .where(eq(s.providers.code, providerCode as 'anthropic' | 'openrouter' | 'openai' | 'google' | 'groq' | 'puter' | 'poyo'))
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
    if (providerCode === 'openrouter') {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new Error('OPENROUTER_API_KEY is required when no provider_secret is stored');
      return key;
    }
    if (providerCode === 'puter') {
      const key = process.env.PUTER_AUTH_TOKEN;
      if (!key) throw new Error('PUTER_AUTH_TOKEN is required when no provider_secret is stored');
      return key;
    }
    if (providerCode === 'poyo') {
      const key = process.env.POYO_API_KEY;
      if (!key) throw new Error('POYO_API_KEY is required when no provider_secret is stored');
      return key;
    }

    throw new Error(`no api key configured for provider ${providerCode}`);
  }
}
