import Stripe from 'stripe';
import { config } from '@consecom/config';

/**
 * Stripe singleton. Lazy-instantiated so the API doesn't crash on boot
 * when keys are missing in dev — the BillingService checks before using.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!config.stripe.secretKey || config.stripe.secretKey.startsWith('sk_test_placeholder')) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  _stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
    typescript: true,
  });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    config.stripe.secretKey &&
      !config.stripe.secretKey.startsWith('sk_test_placeholder') &&
      config.stripe.webhookSecret &&
      !config.stripe.webhookSecret.startsWith('whsec_placeholder'),
  );
}
