import { z } from 'zod';

// OpenAI-compatible chat completion schema (subset — what we accept)
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(200_000),
  name: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatCompletionRequestSchema = z.object({
  model: z.string().min(1).max(120),
  messages: z.array(ChatMessageSchema).min(1).max(200),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().max(200_000).optional(),
  stream: z.boolean().optional().default(false),
  stop: z.union([z.string(), z.array(z.string()).max(4)]).optional(),
  user: z.string().optional(),
});
export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

export const ChatChoiceSchema = z.object({
  index: z.number().int().nonnegative(),
  message: ChatMessageSchema,
  finish_reason: z.enum(['stop', 'length', 'content_filter', 'tool_calls']).nullable(),
});
export type ChatChoice = z.infer<typeof ChatChoiceSchema>;

export const UsageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});
export type Usage = z.infer<typeof UsageSchema>;

export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number().int(),
  model: z.string(),
  choices: z.array(ChatChoiceSchema).min(1),
  usage: UsageSchema,
});
export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

// API Key schema (for client-side display, never includes the secret after creation)
export const ApiKeyPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyPrefix: z.string(),
  status: z.enum(['active', 'revoked', 'expired']),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  lastUsedAt: z.string().datetime().nullable(),
  requestCount: z.number().int().nonnegative(),
});
export type ApiKeyPublic = z.infer<typeof ApiKeyPublicSchema>;

// Returned ONCE at creation time
export const ApiKeyCreatedSchema = ApiKeyPublicSchema.extend({
  key: z.string(),
});
export type ApiKeyCreated = z.infer<typeof ApiKeyCreatedSchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(60),
  expiresInDays: z.number().int().positive().max(365).optional(),
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
