// Create INFINITE plan
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/junin/consecom-routing/packages/db/package.json');
const postgres = require('postgres');

const sql = postgres({
  host: 'db.lvrgonbeumbldzrqegtf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Eqvpanp.050323',
});

async function main() {
  // Add INFINITE to plan_code enum (no-op if already there)
  await sql`ALTER TYPE plan_code ADD VALUE IF NOT EXISTS 'INFINITE'`;
  console.log('✓ Enum plan_code updated');

  const models = await sql`SELECT code FROM models WHERE status = 'active' ORDER BY code`;
  const modelList = models.map((m) => m.code);
  console.log('Models available:', modelList);

  await sql`
    INSERT INTO plans (id, code, display_name, price_cents, duration_hours, rate_limit_per_min, models_allowed, active, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'INFINITE',
      '∞ Vitalício',
      0,
      876000,
      1000,
      ${JSON.stringify(modelList)}::jsonb,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      duration_hours = 876000,
      rate_limit_per_min = 1000,
      models_allowed = EXCLUDED.models_allowed,
      active = true,
      updated_at = NOW()
  `;
  console.log('✓ Plano INFINITE criado (100 anos)');

  const [plan] = await sql`SELECT code, display_name, duration_hours, active, array_length(models_allowed, 1) as n_models FROM plans WHERE code = 'INFINITE'`;
  console.log('Plano:', plan);

  await sql.end();
}

main().catch(console.error);
