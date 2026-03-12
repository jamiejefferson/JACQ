# Jacq — Functional Specification Addendum

**Version:** 1.1
**Date:** 10 March 2026
**Supersedes sections:** §3 Onboarding Flow, parts of §13 In-App Chat Panel, §15 Data Models

> This addendum addresses six foundational gaps in v1.0: dynamic onboarding chat, LLM connection during onboarding, the chat-to-memory extraction pipeline, how information is structured and saved, context persistence architecture, and communication style as a first-class data concept.

---

## Contents

- [A. Onboarding: Real Conversation, Not a Script](#a-onboarding-real-conversation-not-a-script)
- [B. Connect Your LLM — Onboarding Step](#b-connect-your-llm--onboarding-step)
- [C. Chat-to-Memory Extraction Pipeline](#c-chat-to-memory-extraction-pipeline)
- [D. Information Sorting and Persistence](#d-information-sorting-and-persistence)
- [E. Context Persistence — How Jacq Never Forgets](#e-context-persistence--how-jacq-never-forgets)
- [F. Communication Style as a Data Model](#f-communication-style-as-a-data-model)
- [G. Updated Data Models](#g-updated-data-models)
- [H. Updated API Reference](#h-updated-api-reference)

---

## A. Onboarding: Real Conversation, Not a Script

### The Problem with the Previous Approach

v1.0 specified a scripted conversation — a fixed sequence of five questions with predetermined extraction logic. This is wrong for two reasons:

1. **It's not what Jacq is.** The first experience of Jacq should be the best experience of Jacq. A scripted interview is a form in disguise. A real PA asks follow-up questions, picks up on what you say, goes deeper on things that matter.

2. **It produces shallow data.** A script can only capture what it asks for. A real conversation captures what the user volunteers — which is almost always more revealing and more useful.

### What Onboarding Conversation Is

The onboarding conversation is the same chat engine used everywhere in the product, running in a dedicated mode with a specific system prompt. Jacq is genuinely getting to know the user — asking whatever makes sense based on what they say, following threads, pushing back gently when an answer is vague.

The conversation has no defined endpoint. It ends when Jacq has learned enough to be useful — or when the user decides they're done. Jacq signals natural completeness ("I think I have enough to get started — want to carry on, or shall we connect your accounts?") but never forces closure.

### Revised Route: `/onboarding/conversation`

**Purpose:** The real beginning of the relationship. Jacq acts as a PA who is meeting their new employer for the first time — warm, curious, professional, and genuinely interested.

**Architecture:**

This is a full streaming chat session powered by the LLM. No script. No predetermined questions. The LLM is given a system prompt that defines the goal of the conversation, the areas it should try to cover, and what to do with what it learns.

**System prompt (onboarding mode):**

```
You are Jacq, a personal assistant starting your first day with a new person.
This is your first conversation with them. Your goal is to get to know them
well enough to be genuinely useful — not to collect data, but to understand
how they work, what they care about, and where you can help most.

You are warm, curious, and direct. You ask one question at a time. You follow
up on what they say. You go deeper on things that matter. You do not follow a
fixed script.

Topics you should cover, in whatever order feels natural:
- Who they are and what they do
- What their typical week looks like
- What frustrates them most about their current workflow
- Who the most important people in their work life are
- How they prefer to communicate and be communicated with
- What their working hours and off-limits times are
- What they'd most like you to handle

As you learn things, call the extract_understanding tool to save them.
Do not announce that you are saving things — just do it. The UI will show
a "Saved to understanding" confirmation automatically.

When the user mentions something specific — a person's name, a recurring
meeting, a particular pain — ask a follow-up. Do not move on until you
understand it.

When you have covered the main areas and the conversation feels natural to
wrap up, say something like: "I think I have a good picture of how you work.
Shall we get your accounts connected so I can actually start?"

Important: You are not conducting an interview. You are having a conversation.
The goal is for this to feel like meeting a colleague, not filling out a form.
```

**Tools available during onboarding conversation:**

```typescript
// Called by the LLM when it learns something worth saving
extract_understanding({
  section: 'about_me' | 'communication' | 'calendar_time' | 'working_style',
  label: string,      // e.g. "Morning person"
  value: string,      // e.g. "Most effective 8–11am, loses focus after lunch"
  source: 'told',
  confidence: 1.0,
  raw_quote?: string  // the user's actual words, stored for reference
})

// Called when the LLM identifies a key relationship
extract_contact({
  name: string,
  role?: string,
  context?: string,   // how the user described them
  is_vip?: boolean
})

// Called when the LLM wants to note a communication preference
extract_communication_style({
  dimension: string,  // e.g. 'preferred_channel' | 'formality' | 'response_cadence'
  value: string,
  applies_to: 'all' | 'specific_person',
  person_name?: string
})
```

**Frontend behaviour:**

- Full streaming chat — the same `JMsg` / `UMsg` component pattern as everywhere else in the product.
- Text input at bottom. Send on Enter or button tap.
- Each time the LLM calls `extract_understanding`, a "Saved to understanding" gold panel appears inline in the chat immediately, without interrupting the conversation flow.
- The user can see what's being saved in real time. This is transparency by design.
- No progress indicator. No "step 2 of 5". No fixed endpoint.
- A "Done for now" escape hatch in small text below the input bar allows the user to skip ahead at any time. Records `onboarding_phase = 'partial'`.

**Completion detection:**

When the LLM generates a completion message (detected by the backend via a signal in the tool call, not by parsing the text), the UI shows a CTA button sliding up from below the input: "Connect my accounts →". The input bar fades out. The CTA navigates to `/onboarding/llm` (new, see §B).

**Conversation persistence:**

The full conversation is stored in `chat_sessions` with `session_type = 'onboarding'`. This is important — Jacq can reference this conversation in the future. If the user returns mid-onboarding (they closed the app), the session resumes from where it left off.

**Resuming after interruption:**

If `onboarding_complete = false` and `chat_sessions` contains a partial onboarding session, the conversation screen loads with the previous history already rendered and the input ready. Jacq does not repeat what it already knows — it picks up naturally. The LLM receives the full conversation history plus a resumption note in the system prompt: "This conversation was interrupted. The user has returned. Continue naturally from where you left off."

---

## B. Connect Your LLM — Onboarding Step

### Why This Step Exists

The onboarding conversation above requires a functioning LLM. Before that conversation can happen, the user needs a working AI backend. This means the LLM connection step must come **before** the conversation, not after.

Additionally, this step is commercially and architecturally important:
- Free tier users need to connect their own API key, or use a rate-limited shared key.
- Pro users get API access included.
- Users who want local-first processing need to download the desktop app.
- The LLM provider choice affects Jacq's personality and capabilities.

### Revised Onboarding Order

```
/signin
/onboarding/welcome      (cutscene)
/onboarding/llm          (NEW — connect your LLM)
/onboarding/conversation (now real chat, enabled by step above)
/onboarding/connect      (Google workspace)
→ /understanding
```

### Route: `/onboarding/llm`

**Purpose:** Get the user's LLM sorted before Jacq can have a real conversation with them.

**Layout:** Same strip header as conversation screen. Content is a simple single-screen setup — not chat-style.

**Header message** (Gilda Display 22px, centred):
> "Before we talk, let's get your AI sorted."

**Sub-copy** (DM Sans 14px `var(--t2)`, centred, max-width 300px):
> "Jacq uses an AI model to think. You can use ours, bring your own API key, or run one locally."

**Three option cards (stacked, full-width, tappable):**

**Card 1: Use Jacq's AI (default)**
- Label: "Jacq's AI" in Gilda 16px
- Sub: "Powered by Anthropic Claude. Included in your plan."
- Status indicator: green "Included" badge if Pro, amber "Limited on free tier" if Free
- Selected by default: `var(--goldl)` background, `var(--goldb)` border

**Card 2: Bring your own API key**
- Label: "Your own API key"
- Sub: "Use your Anthropic, OpenAI, or Google key. No extra cost."
- On select: expands to show provider selector + API key input field
- Provider options: Anthropic / OpenAI / Google (radio)
- API key field: DM Mono input, password masked
- Validation: `POST /api/llm/validate-key { provider, key }` — returns `{ valid: boolean, model: string }`
- Valid key: green checkmark inline. Invalid: red "That key doesn't seem to work."

**Card 3: Run locally (desktop)**
- Label: "Run locally"
- Sub: "Maximum privacy. Requires the Jacq desktop app."
- On select: shows download link for desktop app + "I've installed it" button
- "I've installed it": pings `GET localhost:39871/status` — if desktop responds, shows connected state
- If not found: "Desktop app not detected — make sure it's running."

**"Continue →" button:** Saves selection to `users.preferences.llm_config`. Navigates to `/onboarding/conversation`. Button disabled until a valid selection is confirmed (Card 1 is pre-confirmed, Card 2 requires validated key, Card 3 requires desktop detection).

**Data saved:**

```typescript
// Saved to users.preferences.llm_config
interface LLMConfig {
  provider: 'jacq' | 'anthropic' | 'openai' | 'google' | 'local'
  model?: string           // e.g. 'claude-3-5-sonnet-20241022'
  api_key_ref?: string     // reference to encrypted key in user_integrations
  local_endpoint?: string  // e.g. 'http://localhost:39871'
  fallback_to_jacq: boolean // if local/custom fails, fall back to Jacq's API
}
```

**API key storage:** Keys are never stored in plaintext in the database. Encrypted with AES-256 using a per-user key derived from their user ID + a server secret. Stored in `user_integrations` with `provider = 'llm_key'`. The application layer decrypts on demand. Never logged.

---

## C. Chat-to-Memory Extraction Pipeline

### The Core Problem

Every time Jacq has a conversation — in onboarding, in the in-app chat panel, or via Telegram — information is shared. Some of it should update the user's understanding entries. Some of it should create tasks or commitments. Some of it should adjust settings. The challenge is doing this reliably, immediately, and transparently.

This pipeline is the most important technical system in Jacq. If it fails, the product fails — Jacq appears to "forget" things, which is the single most damaging behaviour possible.

### Pipeline Architecture

```
User sends message
       │
       ▼
[1] Message received by /api/chat or Telegram webhook
       │
       ▼
[2] Context assembled (see §E — context persistence)
       │
       ▼
[3] LLM generates response WITH tool calls
       │
       ├──► [3a] Response streamed to client
       │
       └──► [3b] Tool calls extracted and queued
                    │
                    ▼
             [4] Tool execution service
                    │
                    ├──► extract_understanding → upsert to understanding_entries
                    ├──► update_setting → PATCH users.preferences
                    ├──► extract_contact → upsert to contacts
                    ├──► extract_communication_style → update communication_profile
                    ├──► create_task → insert to tasks
                    ├──► create_commitment → insert to commitments
                    └──► flag_pattern → insert to patterns
                    │
                    ▼
             [5] Persistence confirmed
                    │
                    ▼
             [6] UI notification
                    │
                    ├──► "Saved to understanding" gold panel in chat
                    ├──► Realtime event to client → update Understanding screen
                    └──► Store message in chat_sessions with tool_calls
```

### Step 3: LLM Tool Call Schema

The LLM is given the following tool definitions for every non-trivial conversation (not search or simple queries):

```typescript
const extractionTools = [

  {
    name: 'extract_understanding',
    description: 'Save something you have learned about the user to their Understanding. Call this whenever the user tells you something meaningful about how they work, what they prefer, or who they are.',
    input_schema: {
      section: { type: 'string', enum: ['about_me', 'communication', 'calendar_time', 'working_style'] },
      label: { type: 'string', description: 'Short label for the entry, e.g. "Morning person"' },
      value: { type: 'string', description: 'The full value, e.g. "Most effective 8–11am. Loses focus after lunch."' },
      confidence: { type: 'number', description: '0–1. Use 1.0 if the user stated it directly. Lower if inferred.' },
      raw_quote: { type: 'string', description: "The user's exact words, if they stated this directly." },
      supersedes_label: { type: 'string', description: 'If this updates an existing entry, provide the label it replaces.' }
    }
  },

  {
    name: 'update_setting',
    description: 'Update a user preference or setting based on what the user has told you.',
    input_schema: {
      path: { type: 'string', description: 'Dot-notation path into users.preferences, e.g. "quiet_hours.start" or "communication.signoff_pa"' },
      value: { type: 'any', description: 'The new value' },
      reason: { type: 'string', description: 'Brief explanation of why you are making this change' }
    }
  },

  {
    name: 'extract_contact',
    description: 'Create or update a contact record when the user mentions someone by name.',
    input_schema: {
      name: { type: 'string' },
      role: { type: 'string', description: 'Their role relative to the user' },
      organisation: { type: 'string' },
      is_vip: { type: 'boolean' },
      jacq_context: { type: 'string', description: 'Everything the user has said about this person, in your own words' }
    }
  },

  {
    name: 'extract_communication_style',
    description: 'Save something about how the user communicates or prefers to be communicated with.',
    input_schema: {
      dimension: {
        type: 'string',
        enum: [
          'preferred_channel', 'formality', 'response_cadence',
          'proactivity_level', 'message_length', 'emotional_register',
          'topic_sensitivity', 'meeting_preference', 'feedback_style',
          'decision_making', 'conflict_style', 'language'
        ]
      },
      value: { type: 'string' },
      notes: { type: 'string', description: 'Any nuance or context' },
      applies_to: { type: 'string', enum: ['all', 'specific_person', 'context'] },
      person_name: { type: 'string', description: 'If applies_to is specific_person' },
      context_description: { type: 'string', description: 'If applies_to is context — e.g. "when under pressure"' }
    }
  },

  {
    name: 'create_task',
    description: 'Create a task when the user asks Jacq to do something or when a clear action item is identified.',
    input_schema: {
      title: { type: 'string' },
      source: { type: 'string', description: 'Brief description of where this came from' },
      tags: { type: 'array', items: { type: 'string' } },
      initial_working_note: { type: 'string', description: 'What Jacq will do first' },
      due_at: { type: 'string', description: 'ISO datetime if a deadline was mentioned' }
    }
  },

  {
    name: 'create_commitment',
    description: 'Log a commitment whenever you promise to do something. Be precise about the deadline.',
    input_schema: {
      description: { type: 'string' },
      due_at: { type: 'string', description: 'ISO datetime. Required — estimate if not stated explicitly.' },
      source_label: { type: 'string', description: 'Human-readable source, e.g. "From in-app chat, 10 Mar 14:22"' }
    }
  },

  {
    name: 'flag_pattern',
    description: 'Note a behavioural pattern you have observed, to be surfaced to the user at the right moment.',
    input_schema: {
      observation: { type: 'string', description: 'Conversational description of the pattern' },
      category: { type: 'string', enum: ['calendar', 'email', 'communication', 'lifestyle'] },
      proposed_action: { type: 'string', description: 'What you would do if the user confirms this pattern' },
      evidence: { type: 'string', description: 'What evidence you have for this pattern' }
    }
  }

]
```

### Step 4: Tool Execution Service

A dedicated server-side service (`/services/tool-execution.ts`) handles all tool calls from the LLM. It runs immediately, in parallel with response streaming to the client.

**Upsert logic for `extract_understanding`:**

```typescript
async function upsertUnderstandingEntry(userId: string, tool: ExtractUnderstandingInput) {
  // Check if an entry with this label already exists
  const existing = await db.understanding_entries.findFirst({
    where: { user_id: userId, label: tool.label }
  })

  if (existing) {
    // Update if value has meaningfully changed
    if (existing.value !== tool.value) {
      await db.understanding_entries.update({
        where: { id: existing.id },
        data: {
          value: tool.value,
          source: tool.confidence === 1.0 ? 'told' : 'inferred',
          confidence: tool.confidence,
          raw_quote: tool.raw_quote,
          updated_at: new Date()
        }
      })
    }
  } else if (tool.supersedes_label) {
    // Find and update the superseded entry
    const superseded = await db.understanding_entries.findFirst({
      where: { user_id: userId, label: tool.supersedes_label }
    })
    if (superseded) {
      await db.understanding_entries.update({
        where: { id: superseded.id },
        data: { label: tool.label, value: tool.value, source: 'told', updated_at: new Date() }
      })
    }
  } else {
    // Create new entry
    await db.understanding_entries.create({
      data: {
        user_id: userId,
        section: tool.section,
        label: tool.label,
        value: tool.value,
        source: tool.confidence === 1.0 ? 'told' : 'inferred',
        confidence: tool.confidence,
        raw_quote: tool.raw_quote
      }
    })
  }

  // Broadcast realtime update to client
  await supabase.channel(`user:${userId}`).send({
    type: 'broadcast',
    event: 'understanding_updated',
    payload: { label: tool.label }
  })
}
```

**Setting update logic:**

```typescript
async function updateSetting(userId: string, tool: UpdateSettingInput) {
  // Use dot-notation path to safely update nested JSONB
  await db.$executeRaw`
    UPDATE users
    SET preferences = jsonb_set(preferences, ${'{' + tool.path.replace('.', ',') + '}'}::text[], ${JSON.stringify(tool.value)}::jsonb)
    WHERE id = ${userId}
  `
  // Log the change for audit trail
  await db.settings_audit_log.create({
    data: { user_id: userId, path: tool.path, new_value: tool.value, reason: tool.reason, changed_by: 'jacq' }
  })
}
```

### Step 6: UI Notification — "Saved to Understanding" Panel

When a tool call is executed and confirmed, the backend sends a server-sent event to the frontend:

```typescript
// Server sends:
{ type: 'tool_result', tool: 'extract_understanding', label: 'Morning person', section: 'about_me' }
```

The frontend chat component listens for these events and injects a `SavedPanel` component into the message thread at the current position:

```tsx
function SavedPanel({ label, section }: { label: string, section: string }) {
  return (
    <div style={{ margin: '4px 22px 8px', padding: '8px 11px', background: 'var(--goldl)', 
                  borderRadius: 10, border: '1px solid var(--goldb)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--gold)', 
                    marginBottom: 3, fontFamily: '"DM Sans"', letterSpacing: '0.02em' }}>
        Saved to understanding
      </div>
      <div style={{ fontSize: 12, color: 'var(--t2)', fontFamily: '"DM Sans"' }}>
        {label}
      </div>
    </div>
  )
}
```

This panel appears inline in the chat, immediately after the message that triggered the save. Not as a toast, not as a notification — as part of the conversation itself.

---

## D. Information Sorting and Persistence

### The Classification Problem

When the user says "I prefer to do calls in the morning and deal with email after lunch", Jacq needs to decide:
- Is this an understanding entry? (Yes — `calendar_time` / "Preferred schedule")
- Is this a communication style preference? (Partial — it's about channel timing)
- Should this affect quiet hours? (No — but it should inform when Jacq schedules things)

This classification happens at the LLM level. The system prompt instructs Jacq to call the appropriate tool (or multiple tools) for any given piece of information. The tool schema makes the classification explicit.

### Conflict Resolution

If the user says something that contradicts a previous entry, the `extract_understanding` tool's `supersedes_label` field handles it. The LLM is responsible for identifying conflicts — it has the current understanding data in its context (see §E).

If both the old and new values could be valid in different contexts, both are kept. Example: "I'm usually an early starter but during school holidays I start late" → two entries, both valid, both stored.

### Deduplication Strategy

The upsert logic in §C Step 4 handles duplicates by matching on `label`. This means label consistency matters — the LLM must use consistent labels. This is enforced via:

1. The system prompt instructs Jacq to check existing entries before creating new ones.
2. The context injection (§E) always includes the current understanding entries, so the LLM can see what already exists.
3. If a label already exists, the LLM should call `extract_understanding` with the new value only if it's meaningfully different — otherwise it can acknowledge without saving.

### Validation Before Persistence

Every tool call goes through a validation layer before database write:

```typescript
function validateUnderstandingEntry(input: ExtractUnderstandingInput): ValidationResult {
  if (!input.label || input.label.length < 2) return { valid: false, reason: 'label too short' }
  if (!input.value || input.value.length < 3) return { valid: false, reason: 'value too short' }
  if (!['about_me','communication','calendar_time','working_style'].includes(input.section)) {
    return { valid: false, reason: 'invalid section' }
  }
  if (input.confidence < 0 || input.confidence > 1) return { valid: false, reason: 'invalid confidence' }
  return { valid: true }
}
```

Failed validations are logged but do not surface errors to the user. The entry is simply not saved, and Jacq continues the conversation.

### The `settings_audit_log` Table

Every time a setting is changed by Jacq (not by the user directly via the Settings UI), it is logged:

```sql
CREATE TABLE settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,           -- e.g. 'quiet_hours.start'
  old_value JSONB,
  new_value JSONB NOT NULL,
  reason TEXT,                  -- Jacq's explanation
  changed_by TEXT DEFAULT 'jacq', -- 'jacq' | 'user'
  session_id UUID,              -- link back to the chat session
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This is the audit trail visible from Settings → Audit Log. Users can see every setting change Jacq has made, when, and why. They can revert any change from the audit log.

---

## E. Context Persistence — How Jacq Never Forgets

### The Problem

LLMs are stateless. Each API call knows only what is in its context window. If Jacq is sent a Telegram message at 9am on a Tuesday having last spoken to the user three weeks ago, it must behave as though no time has passed and nothing has been forgotten. This is the hardest engineering problem in the product.

### The Solution: Assembled Context

Before every LLM call — whether from the in-app chat, Telegram webhook, or any scheduled job — the backend assembles a full context package. This package is inserted into the system prompt. The LLM never relies on conversation history alone.

**Context assembly service (`/services/context.ts`):**

```typescript
async function assembleContext(userId: string, sessionId?: string): Promise<ContextPackage> {
  const [user, understanding, contacts, recentTasks, activeCommitments, recentActivity, commsProfile] = await Promise.all([
    db.users.findUnique({ where: { id: userId } }),
    db.understanding_entries.findMany({ where: { user_id: userId, source: { not: 'dismissed' } } }),
    db.contacts.findMany({ where: { user_id: userId }, orderBy: { last_contact_at: 'desc' }, take: 20 }),
    db.tasks.findMany({ where: { user_id: userId, status: { in: ['todo','jacq_acting','waiting'] } } }),
    db.commitments.findMany({ where: { user_id: userId, status: { in: ['pending','in_progress'] } } }),
    db.activity_log.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 50 }),
    db.communication_profiles.findUnique({ where: { user_id: userId } })
  ])

  return {
    user: { name: user.name, email: user.email },
    preferences: user.preferences,
    understanding: groupBySection(understanding),
    vip_contacts: contacts.filter(c => c.is_vip),
    all_contacts: contacts,
    active_tasks: recentTasks,
    active_commitments: activeCommitments,
    recent_actions: recentActivity,
    communication_profile: commsProfile,
    assembled_at: new Date().toISOString()
  }
}
```

**System prompt context block (injected before every call):**

```
## Current understanding of {user.name}

{understanding.about_me entries formatted as bullet list}
{understanding.communication entries}
{understanding.calendar_time entries}
{understanding.working_style entries}

## Communication profile
{commsProfile rendered as readable description — see §F}

## Active tasks ({count})
{each task: title, status, working_note}

## Active commitments ({count})
{each commitment: description, due_at}

## VIP contacts
{each VIP: name, role, last_contact, open_items_count}

## Recent actions (last 7 days)
{summary of activity log}

## Current preferences
Quiet hours: {start}–{end}, weekends: {weekends}
Autonomy level: {level}
Sign-off as PA: {signoff_pa}
Language: {language}
```

This block is regenerated fresh on every LLM call. It is not cached — understanding entries and settings may have changed since the last call.

### Conversation History

In addition to the context package, recent conversation history is included. The rule is:

- **In-app chat panel:** Full history of the current session (from when the panel was opened to now). Max 50 exchanges. If longer, summarise older messages first.
- **Telegram:** Last 20 Telegram messages between Jacq and the user, regardless of how long ago.
- **Scheduled jobs (briefings, reviews):** No conversation history — context package only.

### Session Storage

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,   -- 'onboarding' | 'in_app' | 'telegram' | 'scheduled'
  channel TEXT,                 -- 'app' | 'telegram'
  context_ref TEXT,             -- screen/section that opened the session, if in-app
  messages JSONB DEFAULT '[]',  -- full message history: [{role, content, tool_calls, timestamp}]
  summary TEXT,                 -- generated when session is long, replaces older messages
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'  -- 'active' | 'completed' | 'abandoned'
);
```

### Long Context Management

When a session exceeds 40 exchanges, the backend runs a summarisation job:

```typescript
async function compressSession(sessionId: string) {
  const session = await db.chat_sessions.findUnique({ where: { id: sessionId } })
  const messages = session.messages as Message[]

  // Keep last 20 messages verbatim
  const recentMessages = messages.slice(-20)
  const olderMessages = messages.slice(0, -20)

  // Summarise older messages
  const summary = await llm.complete({
    system: 'Summarise this conversation history as a concise bullet list of the key things discussed, decided, and saved. Focus on anything relevant to understanding the user.',
    messages: olderMessages.map(m => ({ role: m.role, content: m.content }))
  })

  await db.chat_sessions.update({
    where: { id: sessionId },
    data: {
      messages: recentMessages,
      summary: (session.summary ? session.summary + '\n\n' : '') + summary
    }
  })
}
```

The summary is prepended to the context package on the next call, before the recent message history.

### Cross-Channel Continuity

Jacq maintains continuity across Telegram and in-app chat. If the user discusses something in Telegram, that conversation is available as context when they later open the in-app chat panel — and vice versa.

This is achieved by including recent Telegram messages in the assembled context regardless of which channel the current session is in. The context package has a `recent_telegram_messages` field (last 10 messages, max 3 days old).

### The "Never Forget" Guarantee

The guarantee Jacq can make is:

> Anything the user has told Jacq that was saved to Understanding will be in every future context window. Anything the user said in a conversation but that Jacq did not explicitly save may be summarised or dropped if it was said more than 40 exchanges ago.

This means the extraction pipeline (§C) is load-bearing. If Jacq fails to extract and save something, it may eventually be lost. This is why the extraction tools should be called liberally — better to save something and have a duplicate than to miss it.

---

## F. Communication Style as a Data Model

### Why This Is a First-Class Concept

Communication style is what makes Jacq feel like *your* PA rather than a generic assistant. It determines:

- When Jacq reaches out (proactivity level, timing)
- How Jacq writes messages (formality, length, tone)
- What Jacq avoids (topic sensitivities, things that irritate the user)
- How Jacq interprets the user's messages (e.g. a short reply doesn't mean they're angry)
- How Jacq adapts per person (Sarah gets formal emails; Tom gets a quick Slack-style message)

Without a structured communication style model, Jacq defaults to generic behaviour. With it, Jacq's output becomes unmistakably personal within a few weeks.

### The Communication Profile

```sql
CREATE TABLE communication_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- How Jacq should write
  writing_tone TEXT DEFAULT 'direct and warm',
  writing_formality TEXT DEFAULT 'professional but not stiff',
  writing_length TEXT DEFAULT 'concise — no fluff',
  writing_signature TEXT,          -- default sign-off as user
  preferred_greeting TEXT,         -- how Jacq should open messages to others
  phrases_to_use TEXT[],           -- things the user says that Jacq can echo
  phrases_to_avoid TEXT[],         -- things Jacq should never say on their behalf

  -- How Jacq should communicate proactively
  proactivity_level TEXT DEFAULT 'moderate',
                                   -- 'minimal' | 'moderate' | 'high'
  proactivity_timing TEXT DEFAULT 'within_work_hours',
                                   -- 'immediate' | 'within_work_hours' | 'batched'
  briefing_depth TEXT DEFAULT 'standard',
                                   -- 'minimal' | 'standard' | 'detailed'
  preferred_update_channel TEXT DEFAULT 'telegram',
  update_frequency TEXT DEFAULT 'as_needed',
                                   -- 'as_needed' | 'hourly_digest' | 'morning_evening'

  -- How the user communicates
  user_reply_style TEXT,           -- 'brief' | 'detailed' | 'variable'
  user_emoji_usage TEXT,           -- 'never' | 'occasionally' | 'frequently'
  user_punctuation_style TEXT,     -- 'formal' | 'casual' | 'minimal'
  short_reply_means TEXT,          -- what a short reply signals: 'busy' | 'approval' | 'dismissal'
  silence_means TEXT,              -- what no reply means: 'agreed' | 'missed' | 'rejecting'

  -- Decision making and feedback
  decision_style TEXT,             -- 'fast_gut' | 'deliberate' | 'collaborative'
  feedback_preference TEXT,        -- 'direct' | 'diplomatic' | 'written_not_verbal'
  how_to_disagree TEXT,            -- how Jacq should push back: 'directly' | 'frame_as_question'
  sensitivity_areas TEXT[],        -- topics to tread carefully around

  -- Language
  language TEXT DEFAULT 'en-GB',
  idiom_style TEXT DEFAULT 'british_professional',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Per-Contact Communication Style Overrides

Each contact in `contacts` already has a `communication_preferences` JSONB field. This is now formalised:

```typescript
interface ContactCommunicationPrefs {
  preferred_channel: 'email' | 'telegram' | 'whatsapp' | 'call' | 'slack'
  formality: 'formal' | 'friendly' | 'casual'
  signoff_override?: string        // different sign-off for this person
  response_sla?: string            // e.g. "within 2 hours"
  what_to_avoid?: string[]         // sensitive topics
  their_style?: string             // how they communicate — informs how Jacq reads their messages
  relationship_notes?: string      // anything else Jacq should know
}
```

### How Communication Style Is Learned

**Onboarding:** The onboarding conversation system prompt explicitly asks Jacq to use the `extract_communication_style` tool when the user reveals anything about communication. This includes:
- "I prefer direct feedback" → `dimension: 'feedback_preference', value: 'direct'`
- "I hate long emails" → `dimension: 'message_length', value: 'brief — avoid long emails'` + `phrases_to_avoid: ['I hope this finds you well']` if the user elaborates
- "I usually respond quickly but my short replies just mean I agree" → `dimension: 'short_reply_means', value: 'approval or agreement, not dismissal'`

**Ongoing:** Every Telegram conversation and in-app chat is a source of style signal. The LLM extracts style observations and calls `extract_communication_style` when patterns emerge.

**Weekly review:** Communication style entries are included in the weekly learning review. Inferred style entries always get the amber "confirm?" treatment in the Understanding screen.

### How Communication Style Is Used

**In proactive messaging:** Before sending any Telegram message, Jacq assembles the communication profile and uses it to determine:
- Is now within the preferred update window?
- Should this be one message or batched with others?
- How long should this message be?
- What tone should it take?

**In email drafting:** When drafting on behalf of the user, Jacq:
1. Loads the user's writing profile
2. Loads the recipient's contact communication preferences
3. Drafts the email in the user's voice, adapted for the recipient
4. The prompt explicitly instructs Jacq to write as the user would, not as a generic AI

**In interpreting incoming messages:** When the user sends a short "ok" or no response at all, Jacq uses `short_reply_means` and `silence_means` to interpret correctly before deciding whether to act.

### Communication Style in the Understanding Screen

Communication style dimensions are surfaced as entries in the **Communication** section of the Understanding screen. They are treated identically to other understanding entries — same DataRow component, same JBubble edit affordance, same told/inferred distinction.

Selected dimensions that surface as visible rows:

| Label | Section | Example value |
|-------|---------|---------------|
| Writing tone | Communication | "Direct and warm — no corporate filler" |
| Message length | Communication | "Concise. Say it in one sentence if possible." |
| Proactivity level | Communication | "Moderate — flag important things, batch the rest" |
| Short reply means | Communication | "Usually means agreement, not dismissal" |
| Feedback preference | Communication | "Direct. Doesn't want it softened." |
| Sensitivity areas | Communication | "The agency rebrand — tread carefully" |

Not all communication profile fields need to be surfaced in the UI — some are internal signals (emoji usage, punctuation style) that Jacq uses but the user doesn't need to think about.

### Communication Style API

```
GET    /api/communication-profile          Get full profile
PATCH  /api/communication-profile          Update any field(s)
POST   /api/communication-profile/reset    Reset to defaults
GET    /api/contacts/:id/comm-prefs        Get per-contact prefs
PATCH  /api/contacts/:id/comm-prefs        Update per-contact prefs
```

---

## G. Updated Data Models

### users.preferences — updated shape

```typescript
interface UserPreferences {
  dark_mode: boolean
  autonomy_level: 'cautious' | 'balanced' | 'autonomous'
  autonomy_paused: boolean
  quiet_hours: {
    start: string              // 'HH:MM'
    end: string
    weekends: 'off' | 'same' | 'emergencies_only'
  }
  signoff_pa: string           // "Jacq, PA to [Name]"
  signoff_user: string         // "[First name]"
  weekly_review: { day: number, time: string }
  learning_review: { day: number, time: string }
  pattern_categories: string[]
  llm_config: {
    provider: 'jacq' | 'anthropic' | 'openai' | 'google' | 'local'
    model?: string
    api_key_ref?: string
    local_endpoint?: string
    fallback_to_jacq: boolean
  }
  onboarding_phase: 'none' | 'partial' | 'complete'
  integration_deferred: boolean
}
```

### understanding_entries — updated schema

```sql
ALTER TABLE understanding_entries
  ADD COLUMN raw_quote TEXT,        -- user's exact words, if directly stated
  ADD COLUMN session_id UUID REFERENCES chat_sessions(id),
  ADD COLUMN superseded_by UUID REFERENCES understanding_entries(id);
```

### New table: communication_profiles

See §F for full schema.

### New table: settings_audit_log

See §D for full schema.

### New table: chat_sessions

See §E for full schema.

### New table: llm_routing_log

For debugging and cost visibility:

```sql
CREATE TABLE llm_routing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id),
  provider TEXT NOT NULL,          -- 'jacq' | 'anthropic' | 'openai' | 'google' | 'local'
  model TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  latency_ms INT,
  tools_called TEXT[],
  cost_usd FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## H. Updated API Reference

### Onboarding

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/onboarding/session` | Get current onboarding session (or create if none) |
| POST | `/api/onboarding/message` | Send message to onboarding chat, returns streaming response |
| POST | `/api/onboarding/complete` | Mark onboarding complete, trigger week-1 schedule |
| POST | `/api/llm/validate-key` | Validate user-provided API key `{ provider, key }` |
| GET | `/api/llm/config` | Current LLM configuration for user |
| PATCH | `/api/llm/config` | Update LLM configuration |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message, returns streaming response with SSE tool results |
| GET | `/api/chat/context` | Get assembled context package for debugging |
| GET | `/api/chat/sessions` | Recent chat sessions |
| GET | `/api/chat/sessions/:id` | Full session with messages |
| POST | `/api/chat/sessions/:id/compress` | Manually trigger session compression |

### Communication Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/communication-profile` | Full communication profile |
| PATCH | `/api/communication-profile` | Update fields |
| POST | `/api/communication-profile/reset` | Reset to defaults |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-log` | Settings changes made by Jacq, paginated |
| POST | `/api/audit-log/:id/revert` | Revert a specific setting change |

### Understanding (additions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/understanding?source=inferred` | Filter to inferred entries only |
| GET | `/api/understanding?section=communication` | Filter by section |
| POST | `/api/understanding/bulk` | Batch create/update (used by tool execution service) |

---

## Summary of Changes from v1.0

| Area | v1.0 | v1.1 |
|------|------|------|
| Onboarding conversation | Scripted 5-question sequence | Real LLM conversation with tool-calling extraction |
| LLM setup | Not in onboarding | New `/onboarding/llm` step before conversation |
| Chat extraction | Vague — "LLM extracts structured data" | Full tool schema, execution service, upsert logic, UI notification |
| Data validation | Not specified | Validation layer before every database write |
| Context persistence | Not specified | Full assembled context package, session storage, compression strategy |
| Cross-channel continuity | Not specified | Recent Telegram messages included in all chat contexts |
| Communication style | Single `preferences.communication` JSONB field | Full `communication_profiles` table with 20+ dimensions |
| Per-contact comms prefs | Mentioned but unstructured | Typed `ContactCommunicationPrefs` interface |
| Settings audit | Not specified | `settings_audit_log` table, revert capability |
| LLM routing | Not specified | `llm_routing_log` table for cost and debug visibility |

---

*End of Addendum v1.1*
