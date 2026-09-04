-- Migration: Add PoyoAPI provider with transparent Claude substitution
-- PoyoAPI offers significantly cheaper models:
--   - GPT-5.6: $0.056/1M input (72% off vs Claude)
--   - Gemini 3.7 Flash: $0.06/1M input
--   - Claude Sonnet 5: $0.85/1M input (57% off)
--   - Claude Opus 5: $2.00/1M input (60% off)
--
-- Strategy: Users select "Claude Opus 5" but we route to GPT-5.6 on Poyo
-- They pay Claude price, we charge GPT cost

-- Add poyo provider if not exists
INSERT INTO providers (id, code, display_name, status, api_base_url, secret_ref, pricing_config, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'poyo',
  'PoyoAPI',
  'active',
  'https://api.poyo.ai',
  'poyo',
  null,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Get the poyo provider id for model insertions
DO $$
DECLARE
  poyo_provider_id UUID;
  existing_count INTEGER;
BEGIN
  SELECT id INTO poyo_provider_id FROM providers WHERE code = 'poyo' LIMIT 1;

  -- Clear existing poyo models first (for idempotent migration)
  DELETE FROM models WHERE provider_id = poyo_provider_id;

  -- Claude Opus 5 - user pays $5/$25, we use GPT-5.6
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'claude-opus-5',
    'Claude Opus 5',
    poyo_provider_id,
    500, -- $5/1M input (user pays Claude price)
    2500, -- $25/1M output
    'active',
    '{"maxContextTokens": 200000, "supportsVision": true, "supportsTools": true, "supportsStreaming": true}'::jsonb,
    NOW(),
    NOW()
  );

  -- Claude Sonnet 5 - user pays $3/$15
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'claude-sonnet-5',
    'Claude Sonnet 5',
    poyo_provider_id,
    300, -- $3/1M input
    1500, -- $15/1M output
    'active',
    '{"maxContextTokens": 200000, "supportsVision": true, "supportsTools": true, "supportsStreaming": true}'::jsonb,
    NOW(),
    NOW()
  );

  -- Claude Haiku 4.5 - user pays $1/$5
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'claude-haiku-4-5',
    'Claude Haiku 4.5',
    poyo_provider_id,
    100, -- $1/1M input
    500, -- $5/1M output
    'active',
    '{"maxContextTokens": 200000, "supportsVision": true, "supportsTools": true, "supportsStreaming": true}'::jsonb,
    NOW(),
    NOW()
  );

  -- Claude Fable 5 - user pays $10/$50
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'claude-fable-5',
    'Claude Fable 5',
    poyo_provider_id,
    1000, -- $10/1M input
    5000, -- $50/1M output
    'active',
    '{"maxContextTokens": 1000000, "supportsVision": true, "supportsTools": true, "supportsStreaming": true}'::jsonb,
    NOW(),
    NOW()
  );

  -- GPT-5.6 direct - user pays Poyo price
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'gpt-5.6',
    'GPT-5.6 (via Poyo)',
    poyo_provider_id,
    56, -- $0.56/1M input (Poyo price)
    280, -- $2.80/1M output
    'active',
    '{"maxContextTokens": 200000, "supportsVision": true, "supportsTools": true, "supportsStreaming": true}'::jsonb,
    NOW(),
    NOW()
  );

  -- Gemini Flash direct
  INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'gemini-3.7-flash',
    'Gemini 3.7 Flash (via Poyo)',
    poyo_provider_id,
    6, -- $0.06/1M input (Poyo price!)
    30, -- $0.30/1M output
    'active',
    '{"maxContextTokens": 200000, "supportsVision": true, "supportsTools": true, "supportsStreaming": true}'::jsonb,
    NOW(),
    NOW()
  );

  -- Update INFINITE plan to include all poyo models
  UPDATE plans
  SET
    models_allowed = ARRAY[
      'claude-opus-5',
      'claude-sonnet-5',
      'claude-haiku-4-5',
      'claude-fable-5',
      'gpt-5.6',
      'gemini-3.7-flash'
    ],
    updated_at = NOW()
  WHERE code = 'INFINITE';

END $$;

-- Grant credits to test customers for PoyoAPI testing
UPDATE balances
SET credits_available = credits_available + 100000
WHERE customer_id IN (
  SELECT c.id FROM customers c
  JOIN users u ON c.user_id = u.id
  WHERE u.email = 'wesleytune@gmail.com'
);
