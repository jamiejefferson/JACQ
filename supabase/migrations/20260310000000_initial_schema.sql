-- Jacq initial schema (spec Section 15). Run in Supabase SQL editor or via supabase db push.
-- RLS: all tables scoped by user_id = auth.uid().

-- Users (extend auth; id matches auth.users.id)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Understanding entries
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

CREATE POLICY "understanding_entries_own" ON public.understanding_entries
  FOR ALL USING (auth.uid() = user_id);

-- Tasks (before commitments which may reference task_id)
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

CREATE POLICY "tasks_own" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Task subtasks
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

CREATE POLICY "task_subtasks_via_task" ON public.task_subtasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid())
  );

-- Commitments
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

CREATE POLICY "commitments_own" ON public.commitments
  FOR ALL USING (auth.uid() = user_id);

-- Contacts (before task_people which references contacts)
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

CREATE POLICY "contacts_own" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);

-- Task people (references contacts)
CREATE TABLE IF NOT EXISTS public.task_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  role TEXT
);

ALTER TABLE public.task_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_people_via_task" ON public.task_people
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid())
  );

-- Activity log
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

CREATE POLICY "activity_log_own" ON public.activity_log
  FOR ALL USING (auth.uid() = user_id);

-- Patterns
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

CREATE POLICY "patterns_own" ON public.patterns
  FOR ALL USING (auth.uid() = user_id);

-- Contact open items
CREATE TABLE IF NOT EXISTS public.contact_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  item_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_open_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_open_items_via_contact" ON public.contact_open_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid())
  );

-- Weekly learning reviews
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

CREATE POLICY "weekly_learning_reviews_own" ON public.weekly_learning_reviews
  FOR ALL USING (auth.uid() = user_id);

-- User integrations
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

CREATE POLICY "user_integrations_own" ON public.user_integrations
  FOR ALL USING (auth.uid() = user_id);

