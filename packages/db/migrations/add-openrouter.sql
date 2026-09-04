-- Script direto pra inserir OpenRouter provider e modelos
-- NÃO precisa do runtime TypeScript/Drizzle

-- 1. Inserir OpenRouter provider
INSERT INTO providers (id, code, display_name, status, api_base_url, secret_ref, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'openrouter',
  'OpenRouter',
  'active',
  'https://openrouter.ai/api/v1',
  'openrouter',
  NOW(),
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- 2. Pegar o ID do provider openrouter
DO $$
DECLARE
  openrouter_id uuid;
BEGIN
  SELECT id INTO openrouter_id FROM providers WHERE code = 'openrouter';
  RAISE NOTICE 'OpenRouter provider ID: %', openrouter_id;

  -- 3. Inserir modelos OpenRouter
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'claude-sonnet-5-openrouter', 'Claude Sonnet 5 (via OpenRouter)', openrouter_id, 200, 1000, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'claude-opus-5-openrouter', 'Claude Opus 5 (via OpenRouter)', openrouter_id, 500, 2500, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'claude-haiku-4-5-openrouter', 'Claude Haiku 4.5 (via OpenRouter)', openrouter_id, 100, 500, 'active', '{"maxContextTokens":200000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'claude-fable-5-1-openrouter', 'Claude Fable 5.1 (via OpenRouter)', openrouter_id, 1000, 5000, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
    (gen_random_uuid(), 'claude-opus-4-8-openrouter', 'Claude Opus 4.8 (via OpenRouter)', openrouter_id, 500, 2500, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW())
  ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    provider_id = EXCLUDED.provider_id,
    input_price_per_1k_cents = EXCLUDED.input_price_per_1k_cents,
    output_price_per_1k_cents = EXCLUDED.output_price_per_1k_cents,
    status = EXCLUDED.status,
    capabilities = EXCLUDED.capabilities,
    updated_at = NOW();

  RAISE NOTICE 'OpenRouter models inserted/updated successfully';
END $$;
