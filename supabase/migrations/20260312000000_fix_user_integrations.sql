-- Fix: ensure user_integrations exists (e.g. if initial schema was run without this table).
-- Run in Supabase Dashboard → SQL Editor, or via: supabase db push

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  telegram_chat_id TEXT,
  connected_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_integrations_own" ON public.user_integrations;
CREATE POLICY "user_integrations_own" ON public.user_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Add column for encrypted LLM API keys (addendum v1.1)
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS secret_encrypted TEXT;
