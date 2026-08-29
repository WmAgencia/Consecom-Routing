import { eq, and } from 'drizzle-orm';
import type { Db } from '@consecom/db';
import * as s from '@consecom/db';
import { errors } from '@consecom/shared';

export interface ActiveSubscription {
  subscription: s.Subscription;
  plan: s.Plan;
}

/**
 * SubscriptionService — gatekeeper for the /v1/* gateway.
 * Returns the customer's active, non-expired subscription and plan.
 * Throws with the appropriate error code otherwise.
 */
export class SubscriptionService {
  constructor(private db: Db) {}

  async getActive(customerId: string): Promise<ActiveSubscription> {
    const rows = await this.db
      .select({ subscription: s.subscriptions, plan: s.plans })
      .from(s.subscriptions)
      .innerJoin(s.plans, eq(s.subscriptions.planId, s.plans.id))
      .where(
        and(
          eq(s.subscriptions.customerId, customerId),
          eq(s.subscriptions.status, 'active'),
        ),
      )
      .orderBy(s.subscriptions.startedAt)
      .limit(1);

    const found = rows[0];
    if (!found) throw errors.subscriptionExpired('no active subscription');

    if (found.subscription.expiresAt < new Date()) {
      // Lazily flip to expired (best-effort; race-tolerant).
      await this.db
        .update(s.subscriptions)
        .set({ status: 'expired' })
        .where(eq(s.subscriptions.id, found.subscription.id));
      throw errors.subscriptionExpired('subscription has expired');
    }

    if (!found.plan.active) {
      throw errors.forbidden('plan is no longer active');
    }

    return found;
  }
}
