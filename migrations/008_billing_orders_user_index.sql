CREATE INDEX IF NOT EXISTS consecom_billing_site_orders_user_idx
  ON consecom_billing_site_orders(user_id, created_at DESC);
