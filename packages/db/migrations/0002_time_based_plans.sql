-- ============================================================================
-- Time-based plans with unlimited usage
-- Replaces the credits-based model. Each plan grants access for a fixed
-- duration (in hours), with no credit count. Display names are user-facing;
-- codes (STARTER / PRO / POWER / ENTERPRISE) remain the stable enum key.
-- ============================================================================

-- 1) Rename duration column (days → hours)
ALTER TABLE plans RENAME COLUMN duration_days TO duration_hours;

-- 2) Add new plan code to the enum
ALTER TYPE plan_code ADD VALUE IF NOT EXISTS 'ENTERPRISE';

-- 3) Drop credits column — usage is now unlimited per period
ALTER TABLE plans DROP COLUMN credits;

-- 4) Update existing plans to the new commercial model
UPDATE plans SET
  display_name       = 'Ilimitado 3 dias',
  price_cents        = 4990,
  duration_hours     = 72,
  rate_limit_per_min = 60,
  active             = true
WHERE code = 'PRO';

UPDATE plans SET
  display_name       = 'Ilimitado 7 dias',
  price_cents        = 10990,
  duration_hours     = 168,
  rate_limit_per_min = 100,
  active             = true
WHERE code = 'POWER';

-- 5) Upsert STARTER (24h / R$25) and ENTERPRISE (30d / R$299,90)
INSERT INTO plans (code, display_name, price_cents, duration_hours, rate_limit_per_min, models_allowed, active)
VALUES
  ('STARTER',    'Ilimitado 24h',    2500,  24,  30, '["claude-sonnet-4-5","claude-haiku-4-5"]', true),
  ('ENTERPRISE', 'Ilimitado 30 dias', 29990, 720, 200,'["claude-sonnet-4-5","claude-haiku-4-5"]', true)
ON CONFLICT (code) DO UPDATE SET
  display_name       = EXCLUDED.display_name,
  price_cents        = EXCLUDED.price_cents,
  duration_hours     = EXCLUDED.duration_hours,
  rate_limit_per_min = EXCLUDED.rate_limit_per_min,
  models_allowed     = EXCLUDED.models_allowed,
  active             = EXCLUDED.active;

-- 6) Deactivate TESTE (MVP placeholder; no commercial price)
UPDATE plans SET active = false WHERE code = 'TESTE';