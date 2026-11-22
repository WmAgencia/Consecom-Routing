-- Baseline: contas de acesso. Em produção a tabela já existe e este comando é ignorado.
CREATE TABLE IF NOT EXISTS consecom_users (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES consecom_tenants(id),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  is_active boolean NOT NULL DEFAULT true,
  session_version integer NOT NULL DEFAULT 1,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
