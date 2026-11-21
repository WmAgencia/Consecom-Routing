-- Um único pacote de teste por conta, exceto pedidos falhos ou expirados.
CREATE UNIQUE INDEX IF NOT EXISTS consecom_billing_site_trial_unique
  ON consecom_billing_site_orders(user_id)
  WHERE plan_id='trial-10m' AND status NOT IN ('failed','expired');
