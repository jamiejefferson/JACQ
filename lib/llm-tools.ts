/** Wrap properties in JSON Schema object (Anthropic requires input_schema.type) */
function schemaObject(properties: Record<string, Record<string, unknown>>): Record<string, unknown> {
  return { type: "object", properties };
}

export const EXTRACTION_TOOLS = [
  {
    name: "extract_understanding",
    description:
      "Save something you learned about the user to their Understanding. Call whenever the user shares a fact, preference, or detail about themselves—even in passing (e.g. 'I'm usually free after 3', 'I hate long meetings', 'I work from home on Fridays'). Use the section that best fits: about_me, communication, calendar_time, working_style. If in doubt, use about_me or working_style. Prefer calling this and then replying briefly over replying without saving.",
    input_schema: schemaObject({
      section: {
        type: "string",
        enum: ["about_me", "communication", "calendar_time", "working_style"],
      },
      label: { type: "string", description: "Short label, e.g. Morning person" },
      value: { type: "string", description: "Full value" },
      confidence: { type: "number", description: "0-1. Use 1.0 if stated directly." },
      raw_quote: { type: "string", description: "User's exact words if stated directly." },
      supersedes_label: { type: "string", description: "If updating an existing entry, its label." },
    }),
  },
  {
    name: "update_setting",
    description: "Update a user preference from what the user told you.",
    input_schema: schemaObject({
      path: { type: "string", description: "Dot path into users.preferences, e.g. quiet_hours.start" },
      value: { type: "string", description: "New value (string representation)" },
      reason: { type: "string", description: "Brief explanation" },
    }),
  },
  {
    name: "extract_contact",
    description: "Create or update a contact when the user mentions someone by name.",
    input_schema: schemaObject({
      name: { type: "string" },
      role: { type: "string" },
      organisation: { type: "string" },
      is_vip: { type: "boolean" },
      jacq_context: { type: "string", description: "What the user said about this person." },
    }),
  },
  {
    name: "extract_communication_style",
    description: "Save how the user communicates or prefers to be communicated with.",
    input_schema: schemaObject({
      dimension: {
        type: "string",
        enum: [
          "preferred_channel",
          "formality",
          "response_cadence",
          "proactivity_level",
          "message_length",
          "emotional_register",
          "topic_sensitivity",
          "meeting_preference",
          "feedback_style",
          "decision_making",
          "conflict_style",
          "language",
        ],
      },
      value: { type: "string" },
      notes: { type: "string" },
      applies_to: { type: "string", enum: ["all", "specific_person", "context"] },
      person_name: { type: "string" },
      context_description: { type: "string" },
    }),
  },
  {
    name: "create_task",
    description: "Create a task when the user asks you to do something, mentions something they need to do, or when an action item comes out of the conversation. Call this whenever there is a concrete to-do; do not only reply in text.",
    input_schema: schemaObject({
      title: { type: "string" },
      source: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      initial_working_note: { type: "string" },
      due_at: { type: "string", description: "ISO datetime" },
    }),
  },
  {
    name: "create_commitment",
    description: "Log a commitment when you promise to do something.",
    input_schema: schemaObject({
      description: { type: "string" },
      due_at: { type: "string", description: "ISO datetime" },
      source_label: { type: "string" },
    }),
  },
  {
    name: "flag_pattern",
    description: "Note a behavioural pattern to surface to the user later.",
    input_schema: schemaObject({
      observation: { type: "string" },
      category: { type: "string", enum: ["calendar", "email", "communication", "lifestyle"] },
      proposed_action: { type: "string" },
      evidence: { type: "string" },
    }),
  },
] as const;

export const CALENDAR_TOOLS = [
  {
    name: "calendar_list_events",
    description:
      "List upcoming events from the user's Google Calendar. Use this when the user asks about their schedule, what's coming up, or anything calendar-related. You can read calendar events without asking for permission first.",
    input_schema: schemaObject({
      days_ahead: { type: "number", description: "Number of days to look ahead. Default 7." },
      query: { type: "string", description: "Optional text filter to match event titles." },
    }),
  },
  {
    name: "calendar_create_event",
    description:
      "Create a new event on the user's Google Calendar. ALWAYS confirm the details with the user before calling this tool.",
    input_schema: schemaObject({
      summary: { type: "string", description: "Event title." },
      start_time: { type: "string", description: "ISO 8601 datetime for event start." },
      end_time: { type: "string", description: "ISO 8601 datetime for event end." },
      description: { type: "string", description: "Optional event description/notes." },
      attendees: { type: "array", items: { type: "string" }, description: "Optional list of email addresses to invite." },
      location: { type: "string", description: "Optional location." },
    }),
  },
  {
    name: "calendar_update_event",
    description:
      "Update an existing event on the user's Google Calendar. ALWAYS confirm the changes with the user before calling this tool.",
    input_schema: schemaObject({
      event_id: { type: "string", description: "The Google Calendar event ID to update." },
      summary: { type: "string", description: "New event title (optional)." },
      start_time: { type: "string", description: "New start time in ISO 8601 (optional)." },
      end_time: { type: "string", description: "New end time in ISO 8601 (optional)." },
      description: { type: "string", description: "New description (optional)." },
      location: { type: "string", description: "New location (optional)." },
    }),
  },
] as const;

export const ALL_TOOLS = [...EXTRACTION_TOOLS, ...CALENDAR_TOOLS];

export type ToolName = (typeof ALL_TOOLS)[number]["name"];

const ONBOARDING_TOOL_NAMES = ["extract_understanding", "extract_contact", "extract_communication_style"] as const;

export function getOnboardingTools() {
  return EXTRACTION_TOOLS.filter((t) =>
    (ONBOARDING_TOOL_NAMES as readonly string[]).includes(t.name)
  ).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}
