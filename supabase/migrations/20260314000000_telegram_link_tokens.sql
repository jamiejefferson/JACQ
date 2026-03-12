-- One-time link tokens for Telegram connect (user opens t.me/Bot?start=TOKEN, taps Start).
CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own token (generate-link). Webhook uses service role to read/delete.
DROP POLICY IF EXISTS "telegram_link_tokens_insert_own" ON public.telegram_link_tokens;
CREATE POLICY "telegram_link_tokens_insert_own" ON public.telegram_link_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
