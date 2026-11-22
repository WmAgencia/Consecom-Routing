-- Reserva do pacote de teste, independente do pedido.
CREATE TABLE IF NOT EXISTS consecom_portal_trials (
  user_id uuid PRIMARY KEY,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
