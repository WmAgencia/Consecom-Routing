// Suspend all customers except admin
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
  // Get all non-admin customers
  const customers = await sql`
    SELECT u.id, u.email FROM users u
    WHERE u.role = 'customer'
    AND u.email != 'admin@consecom.local'
  `;
  console.log(`Found ${customers.length} customers to suspend`);

  for (const c of customers) {
    // Suspend user
    await sql`UPDATE users SET status = 'suspended' WHERE id = ${c.id}`;
    // Suspend customer
    await sql`UPDATE customers SET status = 'suspended' WHERE id = ${c.id}`;
    // Revoke all API keys
    await sql`UPDATE api_keys SET status = 'revoked', revoked_at = NOW() WHERE customer_id = ${c.id} AND status = 'active'`;
    console.log(`  ✓ Suspended: ${c.email}`);
  }

  console.log('\nAll customers suspended!');
  await sql.end();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
