-- Phase 1: add Puter as a provider option.
-- Puter auth uses a user session token (User-Pays model), not a classic
-- API key. The token still goes through the same encrypted
-- provider_secrets table; the adapter just uses it as a Bearer token.
ALTER TYPE provider_code ADD VALUE IF NOT EXISTS 'puter';
