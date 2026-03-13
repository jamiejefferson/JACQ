import type { ContextPackage } from "./context";

export type ProactivityCheck = {
  id: string;
  label: string;
  time: string; // "HH:mm"
  enabled: boolean;
};

export const DEFAULT_PROACTIVITY_CHECKS: ProactivityCheck[] = [
  { id: "morning", label: "Morning", time: "07:30", enabled: true },
  { id: "afternoon", label: "After lunch", time: "13:00", enabled: true },
  { id: "end_of_day", label: "End of day", time: "17:30", enabled: true },
];

const WINDOW_MINUTES = 15;

/** Current time in zone as "HH:mm" (24h). */
export function getCurrentTimeInZone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(now);
}

/** Today's date string (YYYY-MM-DD) in user's timezone for idempotence. */
export function getTodayInZone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // "YYYY-MM-DD"
}

/** Whether slot time is within window of now (both "HH:mm"). */
function isSlotDue(slotTime: string, nowHHmm: string, windowMinutes: number): boolean {
  const [sh, sm] = slotTime.split(":").map(Number);
  const [nh, nm] = nowHHmm.split(":").map(Number);
  const slotMins = sh * 60 + sm;
  const nowMins = nh * 60 + nm;
  const diff = Math.abs(nowMins - slotMins);
  return diff <= windowMinutes || diff >= 24 * 60 - windowMinutes;
}

/** Slot IDs that are due right now (enabled, time in window). */
export function getSlotsDue(
  checks: ProactivityCheck[],
  timezone: string
): string[] {
  const now = getCurrentTimeInZone(timezone);
  const due: string[] = [];
  for (const c of checks) {
    if (!c.enabled) continue;
    if (isSlotDue(c.time, now, WINDOW_MINUTES)) due.push(c.id);
  }
  return due;
}

export function getProactivityChecks(preferences: Record<string, unknown>): ProactivityCheck[] {
  const raw = preferences.proactivity_checks;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((r: unknown) => ({
      id: typeof (r as { id?: string }).id === "string" ? (r as { id: string }).id : "morning",
      label: typeof (r as { label?: string }).label === "string" ? (r as { label: string }).label : "Morning",
      time: typeof (r as { time?: string }).time === "string" ? (r as { time: string }).time : "07:30",
      enabled: typeof (r as { enabled?: boolean }).enabled === "boolean" ? (r as { enabled: boolean }).enabled : true,
    }));
  }
  return [...DEFAULT_PROACTIVITY_CHECKS];
}

export function getProactivityLastRun(preferences: Record<string, unknown>): Record<string, string> {
  const r = preferences.proactivity_last_run;
  return (r && typeof r === "object" && !Array.isArray(r)) ? (r as Record<string, string>) : {};
}

export function setProactivityLastRun(
  preferences: Record<string, unknown>,
  slotId: string,
  dateStr: string
): Record<string, unknown> {
  const lastRun = getProactivityLastRun(preferences);
  return {
    ...preferences,
    proactivity_last_run: { ...lastRun, [slotId]: dateStr },
  };
}

/** Build a short proactive message for the given slot from context (fallback when LLM is not used). */
export function buildProactiveMessage(pkg: ContextPackage, slotId: string): string {
  const name = pkg.user.name ?? "there";
  const hasTasksOrCommitments = pkg.active_tasks.length > 0 || pkg.active_commitments.length > 0;

  // When nothing to report, keep it conversational — just open the chat (one or two sentences).
  if (!hasTasksOrCommitments) {
    if (slotId === "morning") {
      return `Good morning ${name} — hope you're well. Drop me a line when you're free if you fancy a chat or need anything. 🙂`;
    }
    if (slotId === "afternoon") {
      return `Hey ${name}, hope the day's going well. Here if you need anything or just want to chat. 👍`;
    }
    return `End of day ${name}. How did it go? Here if you want to offload or plan for tomorrow.`;
  }

  const lines: string[] = [];
  if (slotId === "morning") {
    lines.push(`Good morning ${name}. Quick check-in — how's your day shaping up? 🙂`);
  } else if (slotId === "afternoon") {
    lines.push(`Hey ${name}, afternoon check-in. How's it going? Anything I can help with?`);
  } else {
    lines.push(`End of day ${name}. How did it go? Anything you want to offload or plan for tomorrow?`);
  }

  lines.push("");
  if (pkg.active_tasks.length > 0) {
    lines.push("On your list:");
    for (const t of pkg.active_tasks.slice(0, 6)) {
      lines.push(`• ${t.title} [${t.status}]`);
    }
    lines.push("");
  }
  if (pkg.active_commitments.length > 0) {
    lines.push("Commitments:");
    for (const c of pkg.active_commitments.slice(0, 4)) {
      lines.push(`• ${c.description}${c.due_at ? ` (due ${c.due_at.slice(0, 10)})` : ""}`);
    }
    lines.push("");
  }
  lines.push("Reply here if you want to chat or change anything.");

  return lines.join("\n");
}

/** Build a one-line context summary for the LLM (tasks + commitments). */
function getContextSummaryForProactive(pkg: ContextPackage): string {
  const parts: string[] = [];
  if (pkg.active_tasks.length > 0) {
    parts.push(`Tasks: ${pkg.active_tasks.slice(0, 6).map((t) => t.title).join("; ")}`);
  }
  if (pkg.active_commitments.length > 0) {
    parts.push(`Commitments: ${pkg.active_commitments.slice(0, 4).map((c) => c.description).join("; ")}`);
  }
  return parts.length ? parts.join(". ") : "No tasks or commitments on their list.";
}

/** Check if current time (in zone) is within quiet hours. */
export function isWithinQuietHours(
  preferences: Record<string, unknown>,
  timezone: string
): boolean {
  const qh = preferences.quiet_hours as { start?: string; end?: string } | undefined;
  if (!qh?.start || !qh?.end) return true;
  const now = getCurrentTimeInZone(timezone);
  return now >= qh.start && now <= qh.end;
}

/** Generate a conversational check-in via LLM; returns null if no config or on error. */
export async function generateProactiveCheckIn(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  pkg: ContextPackage,
  slotId: string
): Promise<string | null> {
  const { resolveLLMConfig, completeWithTools } = await import("./llm-client");
  const config = await resolveLLMConfig(supabase, userId);
  if (!config) return null;

  const name = pkg.user.name ?? "them";
  const slotLabel = slotId === "morning" ? "morning" : slotId === "afternoon" ? "afternoon" : "end of day";
  const contextSummary = getContextSummaryForProactive(pkg);

  const system = `You are Jacq, a warm personal assistant. Write a single short check-in message for Telegram.

Slot: ${slotLabel}
User's name: ${name}
Context: ${contextSummary}

Instructions:
- Check in and start a conversation. Ask how they're doing, offer to help.
- If there are tasks or commitments, mention them briefly (one line) so they know you're on top of it; then invite them to reply.
- If there's nothing on their list (no tasks, commitments, or insights), do NOT give a briefing or report. Write only a short, casual opener to start a conversation — e.g. "how's the day going?", "fancy a quick chat?", "here if you need anything". One or two sentences max. Do not say "No tasks on your list" or similar.
- Optionally add one brief, relevant insight — e.g. a headline or trend from the news, something professional or interesting (not sensational). Keep it to one short sentence if you include it.
- No markdown. Plain text only. British English. Keep the whole message under 120 words. Warm and human, not corporate. You can use the occasional emoji if it fits (e.g. a wave, thumbs up) — keep it light.`;

  try {
    const res = await completeWithTools(
      config,
      system,
      [{ role: "user", content: "Write the check-in message now. Output only the message, no preamble." }],
      []
    );
    const text = (res.content ?? "").trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
