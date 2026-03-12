-- Jacq full schema: run this ONCE in Supabase Dashboard → SQL Editor → New query.
-- Creates all tables (public.users first, then the rest). Safe to run: uses IF NOT EXISTS / IF NOT EXISTS.

-- ========== 1. USERS (must exist first; references auth.users) ==========
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own" ON public.users;
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ========== 2. REST OF INITIAL SCHEMA ==========
CREATE TABLE IF NOT EXISTS public.understanding_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  evidence JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.understanding_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "understanding_entries_own" ON public.understanding_entries;
CREATE POLICY "understanding_entries_own" ON public.understanding_entries FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo',
  tags TEXT[],
  working_note TEXT,
  source TEXT,
  source_ref TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_own" ON public.tasks;
CREATE POLICY "tasks_own" ON public.tasks FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  owner TEXT DEFAULT 'jacq',
  done BOOLEAN DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0
);
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_subtasks_via_task" ON public.task_subtasks;
CREATE POLICY "task_subtasks_via_task" ON public.task_subtasks
  FOR ALL USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  source_type TEXT,
  source_ref TEXT,
  source_label TEXT,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  missed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commitments_own" ON public.commitments;
CREATE POLICY "commitments_own" ON public.commitments FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  organisation TEXT,
  email TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  initials TEXT,
  colour TEXT,
  jacq_context JSONB,
  communication_preferences JSONB,
  response_rate TEXT,
  meeting_frequency TEXT,
  last_contact_at TIMESTAMPTZ,
  alert TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_own" ON public.contacts;
CREATE POLICY "contacts_own" ON public.contacts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.task_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  role TEXT
);
ALTER TABLE public.task_people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_people_via_task" ON public.task_people;
CREATE POLICY "task_people_via_task" ON public.task_people
  FOR ALL USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL,
  autonomy TEXT NOT NULL,
  status TEXT DEFAULT 'done',
  is_undoable BOOLEAN DEFAULT FALSE,
  undone_at TIMESTAMPTZ,
  payload JSONB,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_log_own" ON public.activity_log;
CREATE POLICY "activity_log_own" ON public.activity_log FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,
  category TEXT NOT NULL,
  proposed_action TEXT,
  evidence JSONB,
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patterns_own" ON public.patterns;
CREATE POLICY "patterns_own" ON public.patterns FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.contact_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  item_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contact_open_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_open_items_via_contact" ON public.contact_open_items;
CREATE POLICY "contact_open_items_via_contact" ON public.contact_open_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.weekly_learning_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  entries_to_review UUID[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.weekly_learning_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_learning_reviews_own" ON public.weekly_learning_reviews;
CREATE POLICY "weekly_learning_reviews_own" ON public.weekly_learning_reviews FOR ALL USING (auth.uid() = user_id);

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
CREATE POLICY "user_integrations_own" ON public.user_integrations FOR ALL USING (auth.uid() = user_id);
ALTER TABLE public.user_integrations ADD COLUMN IF NOT EXISTS secret_encrypted TEXT;

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

CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "telegram_link_tokens_insert_own" ON public.telegram_link_tokens;
CREATE POLICY "telegram_link_tokens_insert_own" ON public.telegram_link_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.telegram_bot_config (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  bot_token TEXT NOT NULL,
  bot_username TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.telegram_bot_config ENABLE ROW LEVEL SECURITY;

-- ========== 3. ADDENDUM v1.1 ==========
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
DROP POLICY IF EXISTS "chat_sessions_own" ON public.chat_sessions;
CREATE POLICY "chat_sessions_own" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.understanding_entries
  ADD COLUMN IF NOT EXISTS raw_quote TEXT,
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.understanding_entries(id) ON DELETE SET NULL;

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
DROP POLICY IF EXISTS "communication_profiles_own" ON public.communication_profiles;
CREATE POLICY "communication_profiles_own" ON public.communication_profiles FOR ALL USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "settings_audit_log_own" ON public.settings_audit_log;
CREATE POLICY "settings_audit_log_own" ON public.settings_audit_log FOR ALL USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "llm_routing_log_own" ON public.llm_routing_log;
CREATE POLICY "llm_routing_log_own" ON public.llm_routing_log FOR ALL USING (auth.uid() = user_id);

-- Trigger: when someone signs up with Supabase Auth, create their public.users row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
