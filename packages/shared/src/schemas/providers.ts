import { z } from 'zod';

export const ProviderCodeSchema = z.enum(['anthropic', 'openai', 'google', 'groq']);
export type ProviderCode = z.infer<typeof ProviderCodeSchema>;

export const ProviderStatusSchema = z.enum(['active', 'disabled', 'error']);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  code: ProviderCodeSchema,
  displayName: z.string(),
  status: ProviderStatusSchema,
  apiBaseUrl: z.string().url(),
  secretRef: z.string().nullable(),
});
export type Provider = z.infer<typeof ProviderSchema>;

export const ModelStatusSchema = z.enum(['active', 'disabled']);
export type ModelStatus = z.infer<typeof ModelStatusSchema>;

export const ModelSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  displayName: z.string(),
  providerId: z.string().uuid(),
  inputPricePer1kCents: z.number().int().nonnegative(),
  outputPricePer1kCents: z.number().int().nonnegative(),
  status: ModelStatusSchema,
  capabilities: z.record(z.unknown()),
});
export type Model = z.infer<typeof ModelSchema>;

export const PublicModelSchema = ModelSchema.pick({
  id: true,
  code: true,
  displayName: true,
  status: true,
  capabilities: true,
});
export type PublicModel = z.infer<typeof PublicModelSchema>;
