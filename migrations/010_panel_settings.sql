CREATE TABLE IF NOT EXISTS consecom_proxy_panel_settings (
  id integer PRIMARY KEY,
  window_limit_usd double precision NOT NULL DEFAULT 20,
  monthly_limit_usd double precision NOT NULL DEFAULT 100,
  usd_brl_rate double precision NOT NULL DEFAULT 5.6512,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
