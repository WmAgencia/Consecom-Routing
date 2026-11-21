-- Baseline: pedidos do checkout (espelha o CREATE feito pelo serviço no boot).
CREATE TABLE IF NOT EXISTS consecom_billing_site_orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES consecom_users(id),
  plan_id text NOT NULL,
  price integer NOT NULL,
  session_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  token text,
  encrypted_key text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at timestamp
);
