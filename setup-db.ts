import { createDb } from './packages/db/src/client.js';
import { hash } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';

const db = createDb(process.env.DATABASE_URL!);

async function setup() {
  console.log('Setting up initial data...');

  // Create admin user
  const adminHash = await hash('ChangeMe123!');
  await db.execute(sql`INSERT INTO users (email, password_hash, name, role, status, created_at, updated_at)
    VALUES ('admin@consecom.local', ${adminHash}, 'Admin', 'superadmin', 'active', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = ${adminHash}`);

  // Create test customer
  const userHash = await hash('Test123!');
  await db.execute(sql`INSERT INTO users (email, password_hash, name, role, status, created_at, updated_at)
    VALUES ('test@consecom.com.br', ${userHash}, 'Test User', 'user', 'active', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = ${userHash}`);

  // Get user ID
  const userResult = await db.execute(sql`SELECT id FROM users WHERE email = 'test@consecom.com.br' LIMIT 1`);
  const userId = userResult[0]?.id;

  if (userId) {
    // Create customer
    await db.execute(sql`INSERT INTO customers (user_id, status, created_at, updated_at)
      VALUES (${userId}, 'active', NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING`);

    // Get customer ID
    const customerResult = await db.execute(sql`SELECT id FROM customers WHERE user_id = ${userId} LIMIT 1`);
    const customerId = customerResult[0]?.id;

    if (customerId) {
      // Create balance
      await db.execute(sql`INSERT INTO balances (customer_id, credits_remaining, credits_reserved, last_updated)
        VALUES (${customerId}, 100000, 0, NOW())
        ON CONFLICT (customer_id) DO UPDATE SET credits_remaining = 100000`);

      // Create API key
      const keyPrefix = 'sk_cr_live_';
      const keyRandom = randomBytes(24).toString('base64url');
      const apiKey = keyPrefix + keyRandom;
      const prefix = keyPrefix + keyRandom.slice(0, 12);
      const keyHash = await hash(apiKey);

      await db.execute(sql`INSERT INTO api_keys (customer_id, prefix, key_hash, name, status, created_at, updated_at)
        VALUES (${customerId}, ${prefix}, ${keyHash}, 'Test Key', 'active', NOW(), NOW())
        ON CONFLICT DO NOTHING`);

      console.log('API Key:', apiKey);
    }
  }

  console.log('Setup complete!');
  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
