import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import {
  estimateMaxCostCents,
  type AdapterContext,
  type ChatRequest,
  type ChatResponse,
  type CostBreakdown,
  type ModelDescriptor,
  type ProviderAdapter,
} from '@consecom/shared';

/**
 * AnthropicAdapter — wraps the official @anthropic-ai/sdk.
 *
 * The SDK accepts a `baseURL` constructor option, so we point it at the
 * Consecom Nexxus proxy (api.nexxus-pro.site) instead of api.anthropic.com.
 * The contract on the wire is identical — same headers, same body shape,
 * same response. This means future changes to the proxy are transparent.
 */
export class AnthropicAdapter implements ProviderAdapter {
  readonly id = 'anthropic' as const;
  readonly displayName = 'Anthropic';

  private models: ModelDescriptor[];

  constructor(private readonly baseUrl: string) {
    if (!baseUrl) throw new Error('AnthropicAdapter requires a baseUrl');
    this.models = DEFAULT_MODELS;
  }

  async chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse> {
    const client = new Anthropic({
      apiKey: ctx.apiKey,
      baseURL: this.baseUrl,
      // Optional: signal forwarding for request cancellation/timeouts.
    });

    // Translate internal ChatRequest → Anthropic Messages shape.
    const system = req.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const messages = req.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    if (messages.length === 0) {
      throw new Error('at least one user/assistant message is required');
    }

    const maxTokens = req.maxTokens ?? 4096;

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: req.model,
      max_tokens: maxTokens,
      messages: messages as Anthropic.MessageParam[],
    };
    if (system) params.system = system;
    if (req.temperature !== undefined) params.temperature = req.temperature;
    if (req.topP !== undefined) params.top_p = req.topP;
    if (req.stop !== undefined) {
      params.stop_sequences = Array.isArray(req.stop) ? req.stop : [req.stop];
    }

    const resp = await client.messages.create(params, {
      signal: ctx.signal,
      headers: ctx.requestId ? { 'x-request-id': ctx.requestId } : undefined,
    });

    // Extract text content. The SDK returns a content array; for simple
    // chat we join all text blocks.
    const content = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const finishReason = mapStopReason(resp.stop_reason);

    return {
      id: resp.id || `req_${randomUUID()}`,
      model: resp.model,
      content,
      finishReason,
      usage: {
        prompt_tokens: resp.usage.input_tokens,
        completion_tokens: resp.usage.output_tokens,
        total_tokens: resp.usage.input_tokens + resp.usage.output_tokens,
      },
    };
  }

  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown {
    const pricing = this.models.find((m) => m.code === resp.model)?.pricing ?? {
      inputPer1kCents: 300,
      outputPer1kCents: 1500,
    };
    // eslint-disable-next-line no-console
    console.log('[estimateCost] resp.model=' + resp.model + ' prompt=' + resp.usage?.prompt_tokens + ' completion=' + resp.usage?.completion_tokens + ' pricing=' + JSON.stringify(pricing));
    const inputCost = Math.ceil((resp.usage.prompt_tokens / 1000) * pricing.inputPer1kCents);
    const outputCost = Math.ceil(
      (resp.usage.completion_tokens / 1000) * pricing.outputPer1kCents,
    );
    return {
      inputCostCents: inputCost,
      outputCostCents: outputCost,
      totalCostCents: inputCost + outputCost,
      currency: 'USD',
    };
  }

  listModels(): ModelDescriptor[] {
    return this.models;
  }
}

function mapStopReason(
  reason: Anthropic.Message['stop_reason'],
): ChatResponse['finishReason'] {
  switch (reason) {
    case 'end_turn':
      return 'stop';
    case 'max_tokens':
      return 'length';
    case 'stop_sequence':
      return 'stop';
    case 'tool_use':
      return 'tool_calls';
    default:
      return null;
  }
}

const DEFAULT_MODELS: ModelDescriptor[] = [
  {
    code: 'claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 300, outputPer1kCents: 1500 },
  },
  {
    code: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 100, outputPer1kCents: 500 },
  },
  {
    code: 'claude-opus-4-5',
    displayName: 'Claude Opus 4.5',
    capabilities: {
      maxContextTokens: 200_000,
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
    },
    pricing: { inputPer1kCents: 1500, outputPer1kCents: 7500 },
  },
];

/** Re-exported for `estimateMaxCostCents` callers in routes. */
export { estimateMaxCostCents };
