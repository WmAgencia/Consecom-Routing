// Script simples pra inserir OpenRouter via pg direto (sem Drizzle overhead)
import pg from 'pg';

const sql = pg.defaults;

async function main() {
  const client = new pg.Client({
    host: 'db.lvrgonbeumbldzrqegtf.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Eqvpanp.050323',
  });

  await client.connect();

  // 1. Inserir provider
  await client.query(`
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
    ON CONFLICT (code) DO NOTHING
  `);
  console.log('✓ Provider openrouter inserted');

  // 2. Pegar ID e inserir modelos
  const res = await client.query(`SELECT id FROM providers WHERE code = 'openrouter'`);
  const providerId = res.rows[0].id;

  await client.query(`
    INSERT INTO models (id, code, display_name, provider_id, input_price_per_1k_cents, output_price_per_1k_cents, status, capabilities, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'claude-sonnet-5-openrouter', 'Claude Sonnet 5 (via OpenRouter)', $1, 200, 1000, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'claude-opus-5-openrouter', 'Claude Opus 5 (via OpenRouter)', $1, 500, 2500, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'claude-haiku-4-5-openrouter', 'Claude Haiku 4.5 (via OpenRouter)', $1, 100, 500, 'active', '{"maxContextTokens":200000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'claude-fable-5-1-openrouter', 'Claude Fable 5.1 (via OpenRouter)', $1, 1000, 5000, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'claude-opus-4-8-openrouter', 'Claude Opus 4.8 (via OpenRouter)', $1, 500, 2500, 'active', '{"maxContextTokens":1000000,"supportsVision":true,"supportsTools":true,"supportsStreaming":true}'::jsonb, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      provider_id = EXCLUDED.provider_id,
      input_price_per_1k_cents = EXCLUDED.input_price_per_1k_cents,
      output_price_per_1k_cents = EXCLUDED.output_price_per_1k_cents,
      status = EXCLUDED.status,
      capabilities = EXCLUDED.capabilities,
      updated_at = NOW()
  `, [providerId]);
  console.log('✓ OpenRouter models inserted');

  await client.end();
  console.log('Done!');
}

main().catch(console.error);
