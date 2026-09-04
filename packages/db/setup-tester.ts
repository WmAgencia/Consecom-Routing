import postgres from 'postgres';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../apps/api/.env.local' });
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

// Find the user
const [user] = await sql`
  SELECT id FROM users WHERE email = 'puter-tester@consecom-test.com'
`;
if (!user) { console.error('user not found'); process.exit(1); }

// Find the POWER plan
const [plan] = await sql`SELECT id FROM plans WHERE code = 'POWER'`;
if (!plan) { console.error('POWER plan not found'); process.exit(1); }

// Activate a 7-day subscription
const subId = (await sql`
  INSERT INTO subscriptions (customer_id, plan_id, status, started_at, expires_at)
  VALUES (${user.id}, ${plan.id}, 'active', NOW(), NOW() + INTERVAL '7 days')
  RETURNING id
`)[0].id;
console.log('subscription created:', subId);

// Add credits (POWER plan includes 100k credits)
await sql`
  INSERT INTO credit_balances (customer_id, credits_available, credits_reserved, credits_used, updated_at)
  VALUES (${user.id}, 100000, 0, 0, NOW())
  ON CONFLICT (customer_id) DO UPDATE SET credits_available = 100000, credits_reserved = 0, credits_used = 0
`;
console.log('credits set: 100k');

await sql.end();
console.log('done');
