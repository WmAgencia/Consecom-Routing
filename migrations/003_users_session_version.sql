-- Invalidação de sessão após troca de senha ou desativação; idempotente em bases existentes.
ALTER TABLE consecom_users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;
