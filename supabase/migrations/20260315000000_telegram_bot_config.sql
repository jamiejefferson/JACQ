-- Single-row config for Telegram bot (token + username). Set via in-app setup; read by webhook and generate-link.
CREATE TABLE IF NOT EXISTS public.telegram_bot_config (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  bot_token TEXT NOT NULL,
  bot_username TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.telegram_bot_config ENABLE ROW LEVEL SECURITY;

-- No policies: only backend (service role) reads/writes. End users never see this table.
