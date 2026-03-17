import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentTimeInZone, getTodayInZone } from "./proactivity";

export type InsightTrigger = {
  id: string;
  user_id: string;
  label: string;
  prompt: string;
  schedule_type: "recurring" | "one_time";
  cron_expression: string | null;
  run_at: string | null;
  timezone: string;
  delivery_channels: string[];
  enabled: boolean;
  is_system_default: boolean;
  created_by: string;
  last_run_at: string | null;
};

export type InsightResultRow = {
  id: string;
  user_id: string;
  trigger_id: string | null;
  trigger_label: string;
  issues: Array<{ summary: string; detail?: string; severity?: string }>;
  opportunities: Array<{ summary: string; detail?: string }>;
  actions: Array<{ summary: string; owner?: string; status?: string }>;
  raw_text: string | null;
  tools_used: string[];
  status: string;
  delivered_via: string[];
  created_at: string;
};

const WINDOW_MINUTES = 15;

const DEFAULT_TRIGGERS: Array<{
  id_suffix: string;
  label: string;
  prompt: string;
  cron_expression: string;
}> = [
  {
    id_suffix: "morning",
    label: "Morning briefing",
    prompt:
      "Review my calendar for today. Check for overdue tasks or commitments due soon. Look for scheduling conflicts, meetings needing prep, and anything at risk. Flag issues, opportunities to add value, and actions needed. Be concise and actionable.",
    cron_expression: "30 7 * * 1-5",
  },
  {
    id_suffix: "afternoon",
    label: "Afternoon check-in",
    prompt:
      "Check progress on today's tasks. Flag anything overdue or at risk. Review the afternoon calendar for prep needed. Note any new commitments or changes since morning. Keep it brief.",
    cron_expression: "0 13 * * 1-5",
  },
  {
    id_suffix: "endofday",
    label: "End of day wrap",
    prompt:
      "Review what happened today — completed tasks, outstanding items, things that slipped. Check tomorrow's calendar. Suggest prep work and carry-forward actions. Summarise concisely.",
    cron_expression: "30 17 * * 1-5",
  },
];

/** Fetch all enabled triggers for a user. */
export async function getTriggersForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<InsightTrigger[]> {
  const { data } = await supabase
    .from("insight_triggers")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);
  return (data ?? []) as InsightTrigger[];
}

/**
 * Simple cron matching: checks if current time (in user's timezone) falls
 * within WINDOW_MINUTES of the cron's hour:minute, and the day-of-week matches.
 * Supports cron format: "minute hour * * dow" where dow can be "1-5", "*", "0,6", etc.
 */
function parseCronTime(cron: string): { minute: number; hour: number; daysOfWeek: number[] | null } | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return null;

  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  if (isNaN(minute) || isNaN(hour)) return null;

  // Parse day-of-week (field 5, 0=Sun, 1=Mon, ..., 6=Sat)
  const dowField = parts[4];
  let daysOfWeek: number[] | null = null;
  if (dowField !== "*") {
    daysOfWeek = [];
    for (const part of dowField.split(",")) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let d = start; d <= end; d++) daysOfWeek.push(d);
        }
      } else {
        const d = parseInt(part, 10);
        if (!isNaN(d)) daysOfWeek.push(d);
      }
    }
  }

  return { minute, hour, daysOfWeek };
}

function getDayOfWeekInZone(timezone: string): number {
  const now = new Date();
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    weekday: "short",
  }).format(now);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

/** Check if a trigger is due right now. */
export function isTriggerDue(trigger: InsightTrigger): boolean {
  const tz = trigger.timezone || "UTC";

  if (trigger.schedule_type === "one_time" && trigger.run_at) {
    const runAt = new Date(trigger.run_at);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - runAt.getTime());
    return diffMs <= WINDOW_MINUTES * 60 * 1000;
  }

  if (trigger.schedule_type === "recurring" && trigger.cron_expression) {
    const parsed = parseCronTime(trigger.cron_expression);
    if (!parsed) return false;

    // Check day-of-week
    if (parsed.daysOfWeek) {
      const todayDow = getDayOfWeekInZone(tz);
      if (!parsed.daysOfWeek.includes(todayDow)) return false;
    }

    // Check time window
    const nowHHmm = getCurrentTimeInZone(tz);
    const [nh, nm] = nowHHmm.split(":").map(Number);
    const nowMins = nh * 60 + nm;
    const slotMins = parsed.hour * 60 + parsed.minute;
    const diff = Math.abs(nowMins - slotMins);
    return diff <= WINDOW_MINUTES || diff >= 24 * 60 - WINDOW_MINUTES;
  }

  return false;
}

/** Get all due triggers for a user, filtering out already-run ones. */
export async function getDueTriggersForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<InsightTrigger[]> {
  const triggers = await getTriggersForUser(supabase, userId);
  const today = getTodayInZone(triggers[0]?.timezone || "UTC");

  return triggers.filter((t) => {
    if (!isTriggerDue(t)) return false;

    // Idempotency: skip if already run today (recurring) or ever (one_time)
    if (t.last_run_at) {
      if (t.schedule_type === "one_time") return false;
      const lastRunDate = t.last_run_at.slice(0, 10);
      if (lastRunDate === today) return false;
    }

    return true;
  });
}

/** Get all enabled triggers not yet run today (ignores time-of-day matching).
 *  Use this when the cron only fires once per day and all triggers should run in one batch. */
export async function getAllPendingTriggersForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<InsightTrigger[]> {
  const triggers = await getTriggersForUser(supabase, userId);
  const today = getTodayInZone(triggers[0]?.timezone || "UTC");

  return triggers.filter((t) => {
    // One-time triggers: check if run_at is today or in the past
    if (t.schedule_type === "one_time") {
      if (t.last_run_at) return false;
      if (t.run_at) {
        const runDate = t.run_at.slice(0, 10);
        return runDate <= today;
      }
      return true;
    }

    // Recurring: check day-of-week matches (respect weekday-only schedules)
    if (t.cron_expression) {
      const parts = t.cron_expression.trim().split(/\s+/);
      if (parts.length >= 5 && parts[4] !== "*") {
        const tz = t.timezone || "UTC";
        const dayStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date());
        const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const todayDow = dayMap[dayStr] ?? 0;
        const allowedDays: number[] = [];
        for (const part of parts[4].split(",")) {
          if (part.includes("-")) {
            const [s, e] = part.split("-").map(Number);
            for (let d = s; d <= e; d++) allowedDays.push(d);
          } else {
            allowedDays.push(parseInt(part, 10));
          }
        }
        if (!allowedDays.includes(todayDow)) return false;
      }
    }

    // Idempotency: skip if already run today
    if (t.last_run_at) {
      const lastRunDate = t.last_run_at.slice(0, 10);
      if (lastRunDate === today) return false;
    }

    return true;
  });
}

/** Mark a trigger as having been run. Disables one_time triggers. */
export async function markTriggerRun(
  supabase: SupabaseClient,
  triggerId: string,
  isOneTime: boolean
): Promise<void> {
  const update: Record<string, unknown> = {
    last_run_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (isOneTime) update.enabled = false;

  await supabase.from("insight_triggers").update(update).eq("id", triggerId);
}

/** Store an insight result. */
export async function storeInsightResult(
  supabase: SupabaseClient,
  result: {
    user_id: string;
    trigger_id: string | null;
    trigger_label: string;
    issues: unknown[];
    opportunities: unknown[];
    actions: unknown[];
    raw_text: string | null;
    tools_used: string[];
    delivered_via: string[];
  }
): Promise<string | null> {
  const { data, error } = await supabase
    .from("insight_results")
    .insert(result)
    .select("id")
    .single();
  if (error) {
    console.error("[storeInsightResult] Error:", error.message);
    return null;
  }
  return data?.id ?? null;
}

/** Seed default triggers for a user if they have none. */
export async function seedDefaultTriggers(
  supabase: SupabaseClient,
  userId: string,
  timezone: string = "Europe/London"
): Promise<void> {
  const { count } = await supabase
    .from("insight_triggers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) return; // Already has triggers

  const rows = DEFAULT_TRIGGERS.map((t) => ({
    user_id: userId,
    label: t.label,
    prompt: t.prompt,
    schedule_type: "recurring",
    cron_expression: t.cron_expression,
    timezone,
    delivery_channels: ["telegram", "web"],
    enabled: true,
    is_system_default: true,
    created_by: "system",
  }));

  const { error } = await supabase.from("insight_triggers").insert(rows);
  if (error) console.error("[seedDefaultTriggers] Error:", error.message);
}
