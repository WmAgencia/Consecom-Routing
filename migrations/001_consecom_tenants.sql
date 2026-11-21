-- Baseline: inquilinos (clientes, funcionários e administração).
CREATE TABLE IF NOT EXISTS consecom_tenants (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
