import type { SupabaseClient } from "@supabase/supabase-js";

const SECTION_ORDER = ["about_me", "communication", "calendar_time", "working_style"] as const;

export type ContextPackage = {
  user: { id: string; name?: string; email?: string };
  preferences: Record<string, unknown>;
  understanding: Record<string, { id: string; label: string; value: string; source: string }[]>;
  vip_contacts: { id: string; name: string; role: string | null; organisation: string | null; is_vip: boolean }[];
  all_contacts: { id: string; name: string; role: string | null; is_vip: boolean }[];
  active_tasks: { id: string; title: string; status: string; working_note: string | null }[];
  active_commitments: { id: string; description: string; due_at: string | null; status: string }[];
  recent_actions: { id: string; description: string; action_type: string; created_at: string }[];
  communication_profile: Record<string, unknown> | null;
  integrations: { gmail: string; calendar: string };
  assembled_at: string;
};

function groupBySection(
  entries: { section: string; id: string; label: string; value: string; source: string }[]
): Record<string, { id: string; label: string; value: string; source: string }[]> {
  const out: Record<string, { id: string; label: string; value: string; source: string }[]> = {};
  for (const s of SECTION_ORDER) out[s] = [];
  for (const e of entries) {
    const s = e.section ?? "about_me";
    if (!out[s]) out[s] = [];
    out[s].push({ id: e.id, label: e.label, value: e.value, source: e.source });
  }
  return out;
}

export async function assembleContext(
  supabase: SupabaseClient,
  userId: string
): Promise<ContextPackage> {
  const [
    userRes,
    understandingRes,
    contactsRes,
    tasksRes,
    commitmentsRes,
    activityRes,
    commProfileRes,
    integrationsRes,
  ] = await Promise.all([
    supabase.from("users").select("id, email, name, preferences").eq("id", userId).single(),
    supabase
      .from("understanding_entries")
      .select("id, section, label, value, source")
      .eq("user_id", userId)
      .neq("source", "dismissed")
      .order("created_at", { ascending: true }),
    supabase
      .from("contacts")
      .select("id, name, role, organisation, is_vip, last_contact_at")
      .eq("user_id", userId)
      .order("last_contact_at", { ascending: false })
      .limit(20),
    supabase
      .from("tasks")
      .select("id, title, status, working_note")
      .eq("user_id", userId)
      .in("status", ["todo", "jacq_acting", "waiting"]),
    supabase
      .from("commitments")
      .select("id, description, due_at, status")
      .eq("user_id", userId)
      .in("status", ["pending", "in_progress"]),
    supabase
      .from("activity_log")
      .select("id, description, action_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("communication_profiles").select("*").eq("user_id", userId).single(),
    supabase
      .from("user_integrations")
      .select("provider, status, access_token")
      .eq("user_id", userId)
      .in("provider", ["gmail", "calendar"]),
  ]);

  const user = (userRes.data ?? {}) as { id?: string; name?: string; email?: string; preferences?: unknown };
  const preferences = (user.preferences ?? {}) as Record<string, unknown>;
  const understanding = groupBySection((understandingRes.data ?? []) as { section: string; id: string; label: string; value: string; source: string }[]);
  const allContacts = (contactsRes.data ?? []) as { id: string; name: string; role: string | null; organisation: string | null; is_vip: boolean }[];
  const vip_contacts = allContacts.filter((c) => c.is_vip);
  const active_tasks = (tasksRes.data ?? []) as { id: string; title: string; status: string; working_note: string | null }[];
  const active_commitments = (commitmentsRes.data ?? []) as { id: string; description: string; due_at: string | null; status: string }[];
  const recent_actions = (activityRes.data ?? []) as { id: string; description: string; action_type: string; created_at: string }[];
  const communication_profile = commProfileRes.data as Record<string, unknown> | null;

  const intRows = (integrationsRes.data ?? []) as Array<{ provider: string; status: string | null; access_token: string | null }>;
  const intStatus = (provider: string) => {
    const row = intRows.find((r) => r.provider === provider);
    if (!row) return "not_connected";
    const s = row.status ?? "";
    if (s === "revoked") return "revoked";
    if (s !== "active") return "not_connected";
    if (!row.access_token) return "connected_no_token";
    return "ready";
  };
  const integrations = { gmail: intStatus("gmail"), calendar: intStatus("calendar") };

  return {
    user: { id: user.id ?? userId, name: user.name, email: user.email },
    preferences,
    understanding,
    vip_contacts,
    all_contacts: allContacts.map((c) => ({ id: c.id, name: c.name, role: c.role, is_vip: c.is_vip })),
    active_tasks,
    active_commitments,
    recent_actions,
    communication_profile,
    integrations,
    assembled_at: new Date().toISOString(),
  };
}

export function formatContextBlock(pkg: ContextPackage): string {
  const lines: string[] = [];

  const now = new Date();
  lines.push(`## Current date and time`);
  lines.push(`Today is ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}. Current time (UTC): ${now.toISOString()}.`);
  lines.push(`IMPORTANT: When creating calendar events or referencing dates, use the year ${now.getFullYear()}.`);

  lines.push(`## Current understanding of ${pkg.user.name ?? "you"}`);
  for (const section of SECTION_ORDER) {
    const entries = pkg.understanding[section] ?? [];
    if (entries.length) {
      lines.push(`### ${section.replace(/_/g, " ")}`);
      for (const e of entries) {
        lines.push(`- ${e.label}: ${e.value}`);
      }
    }
  }

  if (pkg.communication_profile && Object.keys(pkg.communication_profile).length > 0) {
    lines.push("## Communication profile");
    lines.push(JSON.stringify(pkg.communication_profile, null, 0).replace(/[{}"]/g, " ").trim());
  }

  lines.push(`## Active tasks (${pkg.active_tasks.length})`);
  for (const t of pkg.active_tasks) {
    lines.push(`- ${t.title} [${t.status}]${t.working_note ? ` — ${t.working_note}` : ""}`);
  }

  lines.push(`## Active commitments (${pkg.active_commitments.length})`);
  for (const c of pkg.active_commitments) {
    lines.push(`- ${c.description} (due ${c.due_at ?? "—"})`);
  }

  lines.push("## VIP contacts");
  for (const c of pkg.vip_contacts) {
    lines.push(`- ${c.name}${c.role ? ` — ${c.role}` : ""}`);
  }

  lines.push("## Recent actions (last 50)");
  for (const a of pkg.recent_actions.slice(0, 20)) {
    lines.push(`- ${a.description} [${a.action_type}]`);
  }

  const prefs = pkg.preferences as Record<string, unknown>;
  const qh = prefs.quiet_hours as { start?: string; end?: string } | undefined;
  lines.push("## Current preferences");
  lines.push(`Quiet hours: ${qh?.start ?? "—"}–${qh?.end ?? "—"}`);
  lines.push(`Autonomy level: ${prefs.autonomy_level ?? "balanced"}`);
  lines.push(`Sign-off as PA: ${prefs.signoff_pa ?? "—"}`);
  lines.push(`Language: ${prefs.language ?? "en-GB"}`);

  lines.push("## Integrations");
  lines.push(`Google Calendar: ${pkg.integrations.calendar === "ready" ? "Connected — calendar tools available" : "Not connected"}`);
  lines.push(`Gmail: ${pkg.integrations.gmail === "ready" ? "Connected — email tools available" : "Not connected"}`);

  lines.push("");
  lines.push("---");
  lines.push("After each user message: save any new facts, preferences, action items, or contacts using the tools (extract_understanding, create_task, extract_contact, update_setting, etc.). Do not skip saving.");

  return lines.join("\n");
}
