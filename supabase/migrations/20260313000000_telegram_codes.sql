-- Pairing codes for Telegram connect flow (one per user, 5 min expiry).
CREATE TABLE IF NOT EXISTS public.telegram_codes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id)
);

ALTER TABLE public.telegram_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "telegram_codes_own" ON public.telegram_codes;
CREATE POLICY "telegram_codes_own" ON public.telegram_codes
  FOR ALL USING (auth.uid() = user_id);
