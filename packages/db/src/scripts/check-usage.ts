import postgres from 'postgres';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../apps/api/.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

// Get usage records for our test user
const rows = await sql`
  SELECT
    m.code as model,
    u.input_tokens,
    u.output_tokens,
    u.total_tokens,
    u.cost_cents,
    u.credits_consumed,
    u.created_at
  FROM usage_events u
  JOIN api_keys k ON k.id = u.api_key_id
  JOIN customers c ON c.id = k.customer_id
  JOIN users us ON us.id = c.id
  JOIN models m ON m.id = u.model_id
  WHERE us.email = 'puter-tester@consecom-test.com'
  ORDER BY u.created_at DESC
  LIMIT 20
`;

console.log('Recent usage records:');
for (const r of rows) {
  console.log(`  ${r.model}: ${r.input_tokens} in + ${r.output_tokens} out = ${r.total_tokens} tokens | ${r.cost_cents} cents | ${r.created_at}`);
}

// Sum by model
const byModel = {};
for (const r of rows) {
  if (!byModel[r.model]) byModel[r.model] = { count: 0, totalTokens: 0, totalCents: 0 };
  byModel[r.model].count++;
  byModel[r.model].totalTokens += Number(r.total_tokens);
  byModel[r.model].totalCents += Number(r.cost_cents);
}
console.log('\nPer-model summary:');
for (const [model, s] of Object.entries(byModel)) {
  console.log(`  ${model}: ${s.count} calls, ${s.totalTokens} tokens, ${s.totalCents} cents total`);
}

// Check credits (credit_balances references customers.id, customers references users.id)
const [customer] = await sql`
  SELECT c.id FROM customers c JOIN users u ON u.id = c.id
  WHERE u.email = 'puter-tester@consecom-test.com'
`;
if (customer) {
  const [credits] = await sql`SELECT credits_available, credits_reserved, credits_used FROM credit_balances WHERE customer_id = ${customer.id}`;
  console.log(`\nCredits: available=${credits.credits_available}, reserved=${credits.credits_reserved}, used=${credits.credits_used}`);
} else {
  console.log('\nNo customer found for puter-tester@consecom-test.com');
}

// Also check what models exist
const models = await sql`SELECT code, display_name, status FROM models WHERE code LIKE '%puter%'`;
console.log('\nPuter models in DB:');
for (const m of models) {
  console.log(`  ${m.code} [${m.status}]`);
}

await sql.end();
