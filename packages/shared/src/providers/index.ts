import type { ChatCompletionRequest, ChatCompletionResponse, Usage } from '../schemas/usage.js';

/**
 * ProviderAdapter — the interface every AI provider must implement.
 *
 * Adding a new provider (OpenAI, Google, Groq, etc.) means:
 *   1. Implement this interface in a new file under `apps/api/src/providers/<name>/`
 *   2. Add a row to the `providers` table
 *   3. Register it in the ProviderRegistry
 *
 * The rest of the system (routing, billing, credits) is provider-agnostic.
 */
export interface ChatRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string | string[];
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
  usage: Usage;
}

export interface CostBreakdown {
  inputCostCents: number;
  outputCostCents: number;
  totalCostCents: number;
  currency: 'USD';
}

export interface ModelDescriptor {
  code: string;
  displayName: string;
  capabilities: {
    maxContextTokens?: number;
    supportsVision?: boolean;
    supportsTools?: boolean;
    supportsStreaming?: boolean;
  };
  pricing: {
    inputPer1kCents: number;
    outputPer1kCents: number;
  };
}

export interface AdapterContext {
  /** Decrypted provider API key — never logged, never returned */
  apiKey: string;
  /** Request ID for log correlation */
  requestId: string;
  /** Abort signal for timeouts */
  signal?: AbortSignal;
}

export interface ProviderAdapter {
  readonly id: 'anthropic' | 'openai' | 'google' | 'groq';
  readonly displayName: string;

  chat(req: ChatRequest, ctx: AdapterContext): Promise<ChatResponse>;

  /** Estimate cost in cents (USD) given the request shape and the response usage */
  estimateCost(req: ChatRequest, resp: ChatResponse): CostBreakdown;

  /** List models this provider supports */
  listModels(): ModelDescriptor[];
}

/**
 * Zero-credit estimate for a request (worst case for reserve-before-call).
 * Multiplied by a safety margin in the CreditService.
 */
export function estimateMaxCostCents(
  req: ChatRequest,
  pricing: { inputPer1kCents: number; outputPer1kCents: number },
): number {
  // Worst-case heuristic: 4 chars per token, output capped at maxTokens or 4096.
  const inputChars = req.messages.reduce((s, m) => s + m.content.length, 0);
  const inputTokens = Math.ceil(inputChars / 4);
  const outputTokens = req.maxTokens ?? 4096;
  return (
    Math.ceil((inputTokens / 1000) * pricing.inputPer1kCents) +
    Math.ceil((outputTokens / 1000) * pricing.outputPer1kCents)
  );
}

/** Convenience: convert OpenAI-shape request to internal ChatRequest */
export function fromOpenAI(req: ChatCompletionRequest): ChatRequest {
  const out: ChatRequest = {
    model: req.model,
    messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    stream: req.stream,
  };
  if (req.temperature !== undefined) out.temperature = req.temperature;
  if (req.top_p !== undefined) out.topP = req.top_p;
  if (req.max_tokens !== undefined) out.maxTokens = req.max_tokens;
  if (req.stop !== undefined) out.stop = req.stop;
  return out;
}

/** Convenience: convert internal ChatResponse to OpenAI-shape response */
export function toOpenAI(
  resp: ChatResponse,
  requestedModel: string,
): ChatCompletionResponse {
  return {
    id: resp.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: requestedModel,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: resp.content },
        finish_reason: resp.finishReason,
      },
    ],
    usage: resp.usage,
  };
}
