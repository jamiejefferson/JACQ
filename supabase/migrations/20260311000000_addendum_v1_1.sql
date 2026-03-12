-- Addendum v1.1: chat_sessions, communication_profiles, settings_audit_log, llm_routing_log;
-- understanding_entries and users.preferences extensions (logical; no schema change for preferences JSONB shape).
-- RLS on all new tables.

-- 1. Chat sessions (referenced by understanding_entries and llm_routing_log)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  channel TEXT,
  context_ref TEXT,
  messages JSONB DEFAULT '[]',
  summary TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_own" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 2. Alter understanding_entries: raw_quote, session_id, superseded_by
ALTER TABLE public.understanding_entries
  ADD COLUMN IF NOT EXISTS raw_quote TEXT,
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.understanding_entries(id) ON DELETE SET NULL;

-- 3. Communication profiles (addendum F)
CREATE TABLE IF NOT EXISTS public.communication_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  writing_tone TEXT DEFAULT 'direct and warm',
  writing_formality TEXT DEFAULT 'professional but not stiff',
  writing_length TEXT DEFAULT 'concise — no fluff',
  writing_signature TEXT,
  preferred_greeting TEXT,
  phrases_to_use TEXT[],
  phrases_to_avoid TEXT[],
  proactivity_level TEXT DEFAULT 'moderate',
  proactivity_timing TEXT DEFAULT 'within_work_hours',
  briefing_depth TEXT DEFAULT 'standard',
  preferred_update_channel TEXT DEFAULT 'telegram',
  update_frequency TEXT DEFAULT 'as_needed',
  user_reply_style TEXT,
  user_emoji_usage TEXT,
  user_punctuation_style TEXT,
  short_reply_means TEXT,
  silence_means TEXT,
  decision_style TEXT,
  feedback_preference TEXT,
  how_to_disagree TEXT,
  sensitivity_areas TEXT[],
  language TEXT DEFAULT 'en-GB',
  idiom_style TEXT DEFAULT 'british_professional',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communication_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communication_profiles_own" ON public.communication_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 4. Settings audit log
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  reason TEXT,
  changed_by TEXT DEFAULT 'jacq',
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_audit_log_own" ON public.settings_audit_log
  FOR ALL USING (auth.uid() = user_id);

-- 5. LLM routing log
CREATE TABLE IF NOT EXISTS public.llm_routing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  latency_ms INT,
  tools_called TEXT[],
  cost_usd FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.llm_routing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llm_routing_log_own" ON public.llm_routing_log
  FOR ALL USING (auth.uid() = user_id);

-- 6. user_integrations: store encrypted API key for llm_key provider (optional column)
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS secret_encrypted TEXT;
