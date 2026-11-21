-- Baseline: dono de cada chave do LiteLLM (o token é o hash armazenado pelo LiteLLM).
CREATE TABLE IF NOT EXISTS consecom_key_owners (
  key_token text PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES consecom_users(id),
  tenant_id uuid NOT NULL REFERENCES consecom_tenants(id),
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
