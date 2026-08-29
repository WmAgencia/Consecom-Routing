import { describe, it, expect } from 'vitest';
import {
  fromOpenAI,
  toOpenAI,
  estimateMaxCostCents,
  type ChatRequest,
} from '../index.js';

describe('provider helpers', () => {
  it('fromOpenAI maps to internal ChatRequest', () => {
    const out = fromOpenAI({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0.5,
      max_tokens: 100,
      stream: false,
    });
    expect(out.model).toBe('claude-sonnet-4-5');
    expect(out.temperature).toBe(0.5);
    expect(out.maxTokens).toBe(100);
    expect(out.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('toOpenAI returns OpenAI-shape response', () => {
    const openai = toOpenAI(
      {
        id: 'req_123',
        model: 'claude-sonnet-4-5',
        content: 'hello',
        finishReason: 'stop',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      },
      'claude-sonnet-4-5',
    );
    expect(openai.object).toBe('chat.completion');
    expect(openai.choices[0]?.message.content).toBe('hello');
    expect(openai.choices[0]?.finish_reason).toBe('stop');
    expect(openai.usage.total_tokens).toBe(15);
  });

  it('estimateMaxCostCents computes a worst-case upper bound', () => {
    const req: ChatRequest = {
      model: 'm',
      messages: [{ role: 'user', content: 'a'.repeat(4000) }], // ~1000 input tokens
      maxTokens: 1000,
    };
    const cents = estimateMaxCostCents(req, {
      inputPer1kCents: 300,
      outputPer1kCents: 1500,
    });
    expect(cents).toBe(1000 * 0.3 + 1000 * 1.5); // input cost + max output cost
  });
});
