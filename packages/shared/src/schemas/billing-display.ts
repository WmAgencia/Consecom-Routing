import type { Plan, Subscription } from '@consecom/shared';

export type SubscriptionWithPlan = {
  subscription: Subscription;
  plan: Plan;
};
