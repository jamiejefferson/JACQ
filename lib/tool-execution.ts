import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolName } from "./llm-tools";
import { getGoogleAccessToken, googleCalendarFetch, googleGmailFetch, googleTasksFetch, decodeBase64Url } from "./google-client";

const SECTIONS = ["about_me", "communication", "calendar_time", "working_style"] as const;

function validateUnderstanding(args: Record<string, unknown>): { valid: boolean; reason?: string } {
  const label = typeof args.label === "string" ? args.label : "";
  const value = typeof args.value === "string" ? args.value : "";
  const section = args.section;
  const confidence = typeof args.confidence === "number" ? args.confidence : 1;

  if (!label || label.length < 2) return { valid: false, reason: "label too short" };
  if (!value || value.length < 3) return { valid: false, reason: "value too short" };
  if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) return { valid: false, reason: "invalid section" };
  if (confidence < 0 || confidence > 1) return { valid: false, reason: "invalid confidence" };
  return { valid: true };
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split(".");
  const out = JSON.parse(JSON.stringify(obj));
  let cur: Record<string, unknown> = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!(key in cur) || typeof cur[key] !== "object") cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return out;
}

export type ToolResult =
  | { ok: true; tool: string; label?: string; section?: string; data?: string }
  | { ok: false; tool: string; reason: string };

export async function executeTool(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string | null,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    if (toolName === "extract_understanding") {
      const v = validateUnderstanding(args);
      if (!v.valid) return { ok: false, tool: toolName, reason: v.reason ?? "validation failed" };

      const section = args.section as string;
      const label = String(args.label ?? "").trim();
      const value = String(args.value ?? "").trim();
      const source = (args.confidence === 1 ? "told" : "inferred") as string;
      const confidence = Number(args.confidence ?? 1);
      const raw_quote = typeof args.raw_quote === "string" ? args.raw_quote : null;
      const supersedes_label = typeof args.supersedes_label === "string" ? args.supersedes_label : null;

      const { data: existing, error: selectError } = await supabase
        .from("understanding_entries")
        .select("id, value")
        .eq("user_id", userId)
        .eq("label", label)
        .maybeSingle();

      if (selectError) return { ok: false, tool: toolName, reason: selectError.message };

      if (existing) {
        if (existing.value !== value) {
          const { error: updateError } = await supabase
            .from("understanding_entries")
            .update({
              value,
              source,
              confidence,
              raw_quote,
              session_id: sessionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (updateError) return { ok: false, tool: toolName, reason: updateError.message };
        }
      } else if (supersedes_label) {
        const { data: supRow, error: supSelectError } = await supabase
          .from("understanding_entries")
          .select("id")
          .eq("user_id", userId)
          .eq("label", supersedes_label)
          .maybeSingle();
        if (supSelectError) return { ok: false, tool: toolName, reason: supSelectError.message };
        if (supRow) {
          const { error: updateError } = await supabase
            .from("understanding_entries")
            .update({
              label,
              value,
              source: "told",
              session_id: sessionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", supRow.id);
          if (updateError) return { ok: false, tool: toolName, reason: updateError.message };
        } else {
          const { error: insertError } = await supabase.from("understanding_entries").insert({
            user_id: userId,
            section,
            label,
            value,
            source,
            confidence,
            raw_quote,
            session_id: sessionId,
          });
          if (insertError) return { ok: false, tool: toolName, reason: insertError.message };
        }
      } else {
        const { error: insertError } = await supabase.from("understanding_entries").insert({
          user_id: userId,
          section,
          label,
          value,
          source,
          confidence,
          raw_quote,
          session_id: sessionId,
        });
        if (insertError) return { ok: false, tool: toolName, reason: insertError.message };
      }

      return { ok: true, tool: toolName, label, section };
    }

    if (toolName === "update_setting") {
      const path = typeof args.path === "string" ? args.path : "";
      if (!path) return { ok: false, tool: toolName, reason: "path required" };

      const { data: userRow } = await supabase.from("users").select("preferences").eq("id", userId).single();
      const oldVal = (userRow?.preferences as Record<string, unknown>) ?? {};
      const newPrefs = setByPath(oldVal, path, args.value);

      await supabase.from("users").update({ preferences: newPrefs }).eq("id", userId);
      await supabase.from("settings_audit_log").insert({
        user_id: userId,
        path,
        old_value: path.split(".").reduce((o: unknown, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), oldVal),
        new_value: args.value,
        reason: typeof args.reason === "string" ? args.reason : null,
        changed_by: "jacq",
        session_id: sessionId,
      });
      return { ok: true, tool: toolName };
    }

    if (toolName === "extract_contact") {
      const name = String(args.name ?? "").trim();
      if (!name) return { ok: false, tool: toolName, reason: "name required" };

      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", name)
        .maybeSingle();

      const initials = name
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const row = {
        user_id: userId,
        name,
        role: typeof args.role === "string" ? args.role : null,
        organisation: typeof args.organisation === "string" ? args.organisation : null,
        is_vip: Boolean(args.is_vip),
        jacq_context: typeof args.jacq_context === "string" ? args.jacq_context : null,
        initials,
      };

      if (existing) {
        await supabase.from("contacts").update(row).eq("id", existing.id);
      } else {
        await supabase.from("contacts").insert(row);
      }
      return { ok: true, tool: toolName };
    }

    if (toolName === "extract_communication_style") {
      const dimension = typeof args.dimension === "string" ? args.dimension : "";
      const value = typeof args.value === "string" ? args.value : "";
      if (!dimension || !value) return { ok: false, tool: toolName, reason: "dimension and value required" };

      const dimToColumn: Record<string, string> = {
        preferred_channel: "preferred_update_channel",
        formality: "writing_formality",
        response_cadence: "update_frequency",
        proactivity_level: "proactivity_level",
        message_length: "writing_length",
        emotional_register: "writing_tone",
        topic_sensitivity: "sensitivity_areas",
        meeting_preference: "briefing_depth",
        feedback_style: "feedback_preference",
        decision_making: "decision_style",
        conflict_style: "how_to_disagree",
        language: "language",
      };
      const column = dimToColumn[dimension] ?? dimension;

      const { data: existing } = await supabase
        .from("communication_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      const update: Record<string, unknown> = { updated_at: new Date().toISOString(), [column]: value };

      if (existing) {
        await supabase.from("communication_profiles").update(update).eq("id", existing.id);
      } else {
        await supabase.from("communication_profiles").insert({ user_id: userId, ...update });
      }
      return { ok: true, tool: toolName };
    }

    if (toolName === "create_task") {
      const title = String(args.title ?? "").trim();
      if (!title) return { ok: false, tool: toolName, reason: "title required" };
      await supabase.from("tasks").insert({
        user_id: userId,
        title,
        status: "todo",
        tags: Array.isArray(args.tags) ? args.tags : [],
        working_note: typeof args.initial_working_note === "string" ? args.initial_working_note : null,
        source: typeof args.source === "string" ? args.source : null,
        due_at: typeof args.due_at === "string" ? args.due_at : null,
      });
      return { ok: true, tool: toolName };
    }

    if (toolName === "create_commitment") {
      const description = String(args.description ?? "").trim();
      const due_at = typeof args.due_at === "string" ? args.due_at : null;
      if (!description) return { ok: false, tool: toolName, reason: "description required" };
      await supabase.from("commitments").insert({
        user_id: userId,
        description,
        due_at,
        status: "pending",
        source_label: typeof args.source_label === "string" ? args.source_label : null,
      });
      return { ok: true, tool: toolName };
    }

    if (toolName === "flag_pattern") {
      const observation = String(args.observation ?? "").trim();
      const category = typeof args.category === "string" ? args.category : "communication";
      if (!observation) return { ok: false, tool: toolName, reason: "observation required" };
      await supabase.from("patterns").insert({
        user_id: userId,
        observation,
        category,
        proposed_action: typeof args.proposed_action === "string" ? args.proposed_action : null,
        evidence: typeof args.evidence === "string" ? args.evidence : null,
        status: "pending",
      });
      return { ok: true, tool: toolName };
    }

    // --- Calendar tools ---

    if (toolName === "calendar_list_events") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "calendar");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Google Calendar not connected. Ask the user to reconnect Google in Settings." };

      const daysAhead = typeof args.days_ahead === "number" ? args.days_ahead : 7;
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + daysAhead * 86400000).toISOString();

      let path = `/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;
      if (typeof args.query === "string" && args.query.trim()) {
        path += `&q=${encodeURIComponent(args.query.trim())}`;
      }

      console.log(`[calendar_list_events] timeMin=${timeMin} timeMax=${timeMax} token=${accessToken.slice(0, 10)}...`);

      const res = await googleCalendarFetch(accessToken, path);
      if (!res.ok) {
        const err = await res.text();
        console.error(`[calendar_list_events] API error ${res.status}: ${err}`);
        return { ok: false, tool: toolName, reason: `Calendar API error: ${err}` };
      }

      const body = (await res.json()) as { items?: Array<Record<string, unknown>>; summary?: string };
      console.log(`[calendar_list_events] Calendar: ${body.summary ?? "unknown"}, events: ${body.items?.length ?? 0}`);

      const events = (body.items ?? []).map((e) => {
        const start = (e.start as Record<string, string>)?.dateTime ?? (e.start as Record<string, string>)?.date ?? "";
        const end = (e.end as Record<string, string>)?.dateTime ?? (e.end as Record<string, string>)?.date ?? "";
        return {
          id: e.id,
          summary: e.summary ?? "(No title)",
          start,
          end,
          location: e.location ?? null,
          description: e.description ? String(e.description).slice(0, 200) : null,
          attendees: Array.isArray(e.attendees) ? (e.attendees as Array<{ email?: string }>).map((a) => a.email).filter(Boolean) : [],
        };
      });

      if (events.length === 0) {
        return { ok: true, tool: toolName, data: `No events found in the next ${daysAhead} day(s).` };
      }

      const formatted = events
        .map((e) => {
          const startDate = new Date(e.start);
          const endDate = new Date(e.end);
          const dateStr = startDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
          const timeStr = e.start.includes("T")
            ? `${startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}–${endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
            : "All day";
          const parts = [`${dateStr}, ${timeStr}: ${e.summary} [id:${e.id}]`];
          if (e.location) parts.push(`  Location: ${e.location}`);
          if (e.attendees.length) parts.push(`  Attendees: ${e.attendees.join(", ")}`);
          return parts.join("\n");
        })
        .join("\n");

      return { ok: true, tool: toolName, data: `${events.length} event(s) in the next ${daysAhead} day(s):\n${formatted}` };
    }

    if (toolName === "calendar_create_event") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "calendar");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Google Calendar not connected. Ask the user to reconnect Google in Settings." };

      const summary = typeof args.summary === "string" ? args.summary.trim() : "";
      const startTime = typeof args.start_time === "string" ? args.start_time : "";
      const endTime = typeof args.end_time === "string" ? args.end_time : "";
      if (!summary || !startTime || !endTime) return { ok: false, tool: toolName, reason: "summary, start_time, and end_time are required" };

      // Get the calendar's timezone so events are created in the right zone
      let calendarTimeZone = "Europe/London";
      try {
        const calRes = await googleCalendarFetch(accessToken, "/calendars/primary");
        if (calRes.ok) {
          const calData = (await calRes.json()) as { timeZone?: string };
          if (calData.timeZone) calendarTimeZone = calData.timeZone;
        }
      } catch { /* use default */ }

      const event: Record<string, unknown> = {
        summary,
        start: { dateTime: startTime, timeZone: calendarTimeZone },
        end: { dateTime: endTime, timeZone: calendarTimeZone },
      };
      if (typeof args.description === "string") event.description = args.description;
      if (typeof args.location === "string") event.location = args.location;
      if (Array.isArray(args.attendees)) {
        event.attendees = (args.attendees as string[]).map((email) => ({ email }));
      }

      console.log(`[calendar_create_event] Creating: ${summary} | ${startTime} - ${endTime} | tz: ${calendarTimeZone}`);
      console.log(`[calendar_create_event] Event body: ${JSON.stringify(event)}`);

      const res = await googleCalendarFetch(accessToken, "/calendars/primary/events", {
        method: "POST",
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[calendar_create_event] API error ${res.status}: ${err}`);
        return { ok: false, tool: toolName, reason: `Calendar API error: ${err}` };
      }

      const created = (await res.json()) as { id: string; htmlLink: string; summary: string; status: string };
      console.log(`[calendar_create_event] Created: id=${created.id} status=${created.status} link=${created.htmlLink}`);
      return { ok: true, tool: toolName, data: `Event created: "${created.summary}" [id:${created.id}] link:${created.htmlLink}` };
    }

    if (toolName === "calendar_update_event") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "calendar");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Google Calendar not connected. Ask the user to reconnect Google in Settings." };

      const eventId = typeof args.event_id === "string" ? args.event_id.trim() : "";
      if (!eventId) return { ok: false, tool: toolName, reason: "event_id is required" };

      const patch: Record<string, unknown> = {};
      if (typeof args.summary === "string") patch.summary = args.summary;
      if (typeof args.start_time === "string") patch.start = { dateTime: args.start_time };
      if (typeof args.end_time === "string") patch.end = { dateTime: args.end_time };
      if (typeof args.description === "string") patch.description = args.description;
      if (typeof args.location === "string") patch.location = args.location;

      const res = await googleCalendarFetch(accessToken, `/calendars/primary/events/${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const err = await res.text();
        return { ok: false, tool: toolName, reason: `Calendar API error: ${err}` };
      }

      const updated = (await res.json()) as { id: string; summary: string };
      return { ok: true, tool: toolName, data: `Event updated: "${updated.summary}" [id:${updated.id}]` };
    }

    // --- Gmail tools ---

    if (toolName === "email_search") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "gmail");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Gmail not connected. Ask the user to reconnect Google in Settings." };

      const query = typeof args.query === "string" ? args.query.trim() : "";
      if (!query) return { ok: false, tool: toolName, reason: "query is required" };
      const maxResults = Math.min(typeof args.max_results === "number" ? args.max_results : 10, 20);

      const listRes = await googleGmailFetch(accessToken, `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
      if (!listRes.ok) {
        const err = await listRes.text();
        return { ok: false, tool: toolName, reason: `Gmail API error: ${err}` };
      }

      const listBody = (await listRes.json()) as { messages?: Array<{ id: string }> };
      const messageIds = (listBody.messages ?? []).map((m) => m.id);

      if (messageIds.length === 0) {
        return { ok: true, tool: toolName, data: `No emails found for query: "${query}"` };
      }

      // Fetch snippets for each message in parallel
      const snippets = await Promise.all(
        messageIds.map(async (id) => {
          const msgRes = await googleGmailFetch(accessToken, `/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
          if (!msgRes.ok) return null;
          const msg = (await msgRes.json()) as {
            id: string;
            snippet: string;
            payload?: { headers?: Array<{ name: string; value: string }> };
          };
          const headers = msg.payload?.headers ?? [];
          const header = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
          return {
            id: msg.id,
            from: header("From"),
            subject: header("Subject"),
            date: header("Date"),
            snippet: msg.snippet ?? "",
          };
        })
      );

      const validSnippets = snippets.filter(Boolean) as Array<{ id: string; from: string; subject: string; date: string; snippet: string }>;
      const formatted = validSnippets
        .map((s) => `From: ${s.from}\nSubject: ${s.subject}\nDate: ${s.date}\nSnippet: ${s.snippet}\n[id:${s.id}]`)
        .join("\n---\n");

      return { ok: true, tool: toolName, data: `${validSnippets.length} email(s) found:\n${formatted}` };
    }

    if (toolName === "email_read") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "gmail");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Gmail not connected. Ask the user to reconnect Google in Settings." };

      const messageId = typeof args.message_id === "string" ? args.message_id.trim() : "";
      if (!messageId) return { ok: false, tool: toolName, reason: "message_id is required" };

      const res = await googleGmailFetch(accessToken, `/users/me/messages/${encodeURIComponent(messageId)}?format=full`);
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, tool: toolName, reason: `Gmail API error: ${err}` };
      }

      const msg = (await res.json()) as {
        id: string;
        payload?: {
          headers?: Array<{ name: string; value: string }>;
          body?: { data?: string };
          parts?: Array<{ mimeType: string; body?: { data?: string }; parts?: Array<{ mimeType: string; body?: { data?: string } }> }>;
        };
      };

      const headers = msg.payload?.headers ?? [];
      const header = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

      // Extract plain text body from MIME parts
      let body = "";
      const extractText = (parts: Array<{ mimeType: string; body?: { data?: string }; parts?: Array<{ mimeType: string; body?: { data?: string } }> }> | undefined): string => {
        if (!parts) return "";
        for (const part of parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return decodeBase64Url(part.body.data);
          }
          if (part.parts) {
            const nested = extractText(part.parts);
            if (nested) return nested;
          }
        }
        return "";
      };

      if (msg.payload?.body?.data) {
        body = decodeBase64Url(msg.payload.body.data);
      } else {
        body = extractText(msg.payload?.parts);
      }

      // Truncate very long emails
      if (body.length > 3000) body = body.slice(0, 3000) + "\n...(truncated)";

      const formatted = `From: ${header("From")}\nTo: ${header("To")}\nSubject: ${header("Subject")}\nDate: ${header("Date")}\n\n${body}`;
      return { ok: true, tool: toolName, data: formatted };
    }

    if (toolName === "email_draft") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "gmail");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Gmail not connected. Ask the user to reconnect Google in Settings." };

      const to = typeof args.to === "string" ? args.to.trim() : "";
      const subject = typeof args.subject === "string" ? args.subject : "";
      const body = typeof args.body === "string" ? args.body : "";
      if (!to || !subject || !body) return { ok: false, tool: toolName, reason: "to, subject, and body are required" };

      const cc = typeof args.cc === "string" ? args.cc.trim() : "";

      // Build RFC 2822 message
      let rawMessage = `To: ${to}\n`;
      if (cc) rawMessage += `Cc: ${cc}\n`;
      rawMessage += `Subject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`;

      // Base64url encode the message
      const encoded = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      const res = await googleGmailFetch(accessToken, "/users/me/drafts", {
        method: "POST",
        body: JSON.stringify({ message: { raw: encoded } }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { ok: false, tool: toolName, reason: `Gmail API error: ${err}` };
      }

      const draft = (await res.json()) as { id: string };
      return { ok: true, tool: toolName, data: `Draft created [draft_id:${draft.id}]. The user can review and send it from Gmail.` };
    }

    if (toolName === "email_send") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "gmail");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Gmail not connected. Ask the user to reconnect Google in Settings." };

      const to = typeof args.to === "string" ? args.to.trim() : "";
      const subject = typeof args.subject === "string" ? args.subject : "";
      const body = typeof args.body === "string" ? args.body : "";
      if (!to || !subject || !body) return { ok: false, tool: toolName, reason: "to, subject, and body are required" };

      const cc = typeof args.cc === "string" ? args.cc.trim() : "";

      // Build RFC 2822 message
      let rawMessage = `To: ${to}\n`;
      if (cc) rawMessage += `Cc: ${cc}\n`;
      rawMessage += `Subject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${body}`;

      // Base64url encode the message
      const encoded = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      console.log(`[email_send] Sending to=${to} subject="${subject}" cc=${cc || "(none)"}`);

      const res = await googleGmailFetch(accessToken, "/users/me/messages/send", {
        method: "POST",
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[email_send] API error ${res.status}: ${err}`);
        return { ok: false, tool: toolName, reason: `Gmail API error: ${err}` };
      }

      const sent = (await res.json()) as { id: string };
      console.log(`[email_send] Sent successfully, message id=${sent.id}`);
      return { ok: true, tool: toolName, data: `Email sent to ${to} [message_id:${sent.id}].` };
    }

    // --- Google Tasks tools ---

    if (toolName === "tasks_list") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "calendar");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Google not connected. Ask the user to reconnect Google in Settings." };

      const maxResults = typeof args.max_results === "number" ? args.max_results : 20;
      const showCompleted = args.show_completed === true;

      let path = `/lists/@default/tasks?maxResults=${maxResults}`;
      if (!showCompleted) path += "&showCompleted=false&showHidden=false";

      const res = await googleTasksFetch(accessToken, path);
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, tool: toolName, reason: `Tasks API error: ${err}` };
      }

      const body = (await res.json()) as { items?: Array<{ id: string; title: string; notes?: string; due?: string; status: string }> };
      const tasks = body.items ?? [];

      if (tasks.length === 0) {
        return { ok: true, tool: toolName, data: showCompleted ? "No tasks found." : "No open tasks. All clear!" };
      }

      const formatted = tasks
        .map((t) => {
          const parts = [`- ${t.title} [${t.status}] [id:${t.id}]`];
          if (t.due) parts.push(`  Due: ${new Date(t.due).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`);
          if (t.notes) parts.push(`  Notes: ${t.notes.slice(0, 100)}`);
          return parts.join("\n");
        })
        .join("\n");

      return { ok: true, tool: toolName, data: `${tasks.length} task(s):\n${formatted}` };
    }

    if (toolName === "tasks_create") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "calendar");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Google not connected. Ask the user to reconnect Google in Settings." };

      const title = typeof args.title === "string" ? args.title.trim() : "";
      if (!title) return { ok: false, tool: toolName, reason: "title is required" };

      const task: Record<string, unknown> = { title };
      if (typeof args.notes === "string") task.notes = args.notes;
      if (typeof args.due_date === "string") task.due = new Date(args.due_date).toISOString();

      const res = await googleTasksFetch(accessToken, "/lists/@default/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });

      if (!res.ok) {
        const err = await res.text();
        return { ok: false, tool: toolName, reason: `Tasks API error: ${err}` };
      }

      const created = (await res.json()) as { id: string; title: string };
      return { ok: true, tool: toolName, data: `Task created: "${created.title}" [id:${created.id}]` };
    }

    if (toolName === "tasks_complete") {
      const accessToken = await getGoogleAccessToken(supabase, userId, "calendar");
      if (!accessToken) return { ok: false, tool: toolName, reason: "Google not connected. Ask the user to reconnect Google in Settings." };

      const taskId = typeof args.task_id === "string" ? args.task_id.trim() : "";
      if (!taskId) return { ok: false, tool: toolName, reason: "task_id is required" };

      const res = await googleTasksFetch(accessToken, `/lists/@default/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { ok: false, tool: toolName, reason: `Tasks API error: ${err}` };
      }

      const updated = (await res.json()) as { id: string; title: string };
      return { ok: true, tool: toolName, data: `Task completed: "${updated.title}"` };
    }

    return { ok: false, tool: toolName, reason: "unknown tool" };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "execution failed";
    return { ok: false, tool: toolName, reason };
  }
}
