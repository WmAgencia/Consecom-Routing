ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'manual';
ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE varchar(40);