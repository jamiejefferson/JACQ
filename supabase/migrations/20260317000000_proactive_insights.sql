-- Proactive Insights: trigger-based investigation system
-- Replaces the hardcoded proactivity check-in slots

-- Triggers define what to investigate and when
CREATE TABLE public.insight_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  prompt TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'recurring',
  cron_expression TEXT,
  run_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  delivery_channels TEXT[] DEFAULT '{telegram,web}',
  enabled BOOLEAN DEFAULT TRUE,
  is_system_default BOOLEAN DEFAULT FALSE,
  created_by TEXT DEFAULT 'user',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.insight_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insight_triggers_own" ON public.insight_triggers
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_insight_triggers_user_enabled ON public.insight_triggers(user_id, enabled) WHERE enabled = TRUE;

-- Results store generated insights
CREATE TABLE public.insight_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES public.insight_triggers(id) ON DELETE SET NULL,
  trigger_label TEXT,
  issues JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  raw_text TEXT,
  tools_used TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'unread',
  delivered_via TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.insight_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insight_results_own" ON public.insight_results
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_insight_results_user_status ON public.insight_results(user_id, status);
