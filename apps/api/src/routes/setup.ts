import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';

export function registerSetupRoutes(app: FastifyInstance) {
  // POST /setup - Create initial data (only works if no users exist)
  app.post('/setup', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if admin exists
      const existingAdmin = await app.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, 'admin@consecom.local')
      });

      if (existingAdmin) {
        return reply.status(400).send({ error: 'Already initialized' });
      }

      // Create superadmin
      const passwordHash = await hash('ChangeMe123!');
      await app.db.insert(app.db.schema.users).values({
        email: 'admin@consecom.local',
        passwordHash,
        name: 'Consecom Admin',
        role: 'superadmin',
        status: 'active',
      });

      // Create test user
      const userHash = await hash('Test123!');
      const [user] = await app.db.insert(app.db.schema.users).values({
        email: 'test@consecom.com.br',
        passwordHash: userHash,
        name: 'Test User',
        role: 'user',
        status: 'active',
      }).returning();

      // Create customer
      const [customer] = await app.db.insert(app.db.schema.customers).values({
        userId: user.id,
        status: 'active',
      }).returning();

      // Create balance
      await app.db.insert(app.db.schema.balances).values({
        customerId: customer.id,
        creditsRemaining: 100000,
        creditsReserved: 0,
        lastUpdated: new Date(),
      });

      // Create API key
      const keyPrefix = 'sk_cr_live_';
      const keyRandom = randomBytes(24).toString('base64url');
      const apiKey = keyPrefix + keyRandom;
      const prefix = keyPrefix + keyRandom.slice(0, 12);
      const keyHash = await hash(apiKey);

      await app.db.insert(app.db.schema.apiKeys).values({
        customerId: customer.id,
        prefix,
        keyHash,
        name: 'Test API Key',
        status: 'active',
      });

      return reply.send({
        success: true,
        admin: { email: 'admin@consecom.local', password: 'ChangeMe123!' },
        user: { email: 'test@consecom.com.br', password: 'Test123!' },
        apiKey,
      });
    } catch (error) {
      console.error('Setup error:', error);
      return reply.status(500).send({ error: 'Setup failed' });
    }
  });

  // GET /setup - Check status
  app.get('/setup', async (req: FastifyRequest, reply: FastifyReply) => {
    const users = await app.db.query.users.findMany();
    const apiKeys = await app.db.query.apiKeys.findMany();

    return reply.send({
      users: users.length,
      apiKeys: apiKeys.length,
      initialized: users.length > 0,
    });
  });

  // GET /setup/users - List all users (dev only)
  app.get('/setup/users', async (req: FastifyRequest, reply: FastifyReply) => {
    const users = await app.db.query.users.findMany({
      columns: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    return reply.send({ users });
  });
}
