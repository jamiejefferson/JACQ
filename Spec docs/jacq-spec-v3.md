# Jacq — Product Specification

**Version:** 3.0
**Date:** 9 March 2026
**Authors:** JJ / Santy

---

## Executive Summary

Jacq is a proactive personal assistant delivered across three integrated components: a browser-based control panel, Telegram as the primary live interface, and a desktop background service. Unlike reactive AI assistants, Jacq monitors your digital life, identifies what needs attention, and acts on your behalf — surfacing insights and actions through Telegram rather than waiting to be asked.

**Core differentiators:**

1. **Proactive, not reactive** — Jacq initiates. It doesn't wait for commands.
2. **Telegram-native** — the live assistant experience lives where users already are.
3. **Control panel, not another chat app** — the web interface is for configuration, transparency, and management.
4. **Local-first intelligence** — a desktop component runs local LLMs for simple tasks, minimising cloud token usage.
5. **Trust by design** — nothing irreversible happens without approval; every action is visible and reversible.
6. **Memory as preference** — there are no settings forms. Everything Jacq knows about you lives in Memory, updated through conversation.

---

## Product Vision

> "A PA that knows what's going on in your life and does something about it."

The fundamental shift: from **reactive** (user asks → Jacq answers) to **proactive** (Jacq monitors → identifies needs → takes action → reports back).

---

## System Architecture

Jacq is three products working together.

### Component 1 — Browser-based Control Panel (mobile-first)

The web interface is not a chat product. It is where users set Jacq up, manage what Jacq knows, and inspect what Jacq is doing. Read-only by default — all changes happen through in-app conversation via the JBubble interaction pattern.

**Purpose:** Configuration, memory management, task oversight, relationship context, activity transparency.

**Not for:** Day-to-day interaction with Jacq. That happens in Telegram.

### Component 2 — Telegram (the live interface)

Jacq's primary communication channel. All proactive messages — morning briefings, alerts, draft approvals, follow-up flags, and check-ins — arrive via Telegram. The user responds in Telegram. This is where the working relationship happens.

**Why Telegram:**
- Push messaging is native to the platform
- Users are already there
- Avoids building a chat interface from scratch
- Reliable notification delivery
- Supports rich message formatting

### Component 3 — Desktop Application (the engine)

A lightweight background service (macOS/Windows menu bar app) that enables Jacq to run local LLMs and control the browser for research and automation.

**Capabilities:**
- Stores, selects, and runs local LLM models (Llama 3, Phi-3, Mistral, etc.)
- Routes simple tasks to local models, reducing cloud token costs
- Provides browser control for web research and automation tasks
- Shows real-time token split (local vs cloud) and system resource usage
- Minimal UI: status indicator, model selector, browser control toggle, current task

---

## Target Users

### Primary: The Overwhelmed Professional

- **Who:** Executives, founders, managers, consultants (age 28–50)
- **Stack:** Google Workspace, Telegram
- **Pain:** Email overload, calendar chaos, follow-ups that slip, admin overhead
- **Need:** "I want someone to just handle the admin"

### Secondary: The Privacy-Conscious Power User

- **Who:** Technical users who want AI benefits without full data surrender
- **Stack:** Willing to run local models, bring own API keys
- **Pain:** Current AI assistants require full cloud access
- **Need:** Control over data and AI stack

### Tertiary: Freelancers and Small Business Owners

- **Who:** Independent workers managing multiple clients
- **Stack:** Variety, no dedicated support staff
- **Pain:** Admin overhead eats billable time
- **Need:** A PA at a price that makes sense

---

## The Four Pillars

### Pillar 1 — Tasks and Workflow Management

Tasks are not a to-do list. They are a work surface for Jacq — a kanban board of things Jacq is working on, waiting on, or has completed.

**Columns:**

| Column | Meaning |
|--------|---------|
| To Do | Identified, not yet started |
| Jacq Acting | Jacq is actively working on this |
| Waiting | Action sent, awaiting external response |
| Done | Completed (shown as weekly log) |

**Task sources:** Extracted automatically from emails and conversations, or added by the user via JBubble chat. Each task card carries the context Jacq needs to act: source, notes, sub-tasks, people involved, and Jacq's current working notes.

### Pillar 2 — Calendar and Time Optimisation

Jacq acts as a vigilant gatekeeper for the user's time.

- Spots conflicts and double-bookings before they land
- Auto-blocks travel time before off-site meetings
- Flags tight transitions and overloaded days early
- Suggests focus blocks in calendar gaps
- Proactively asks if prep is needed for important meetings
- Never creates or accepts meetings without confirmation

### Pillar 3 — Email and Communication Management

- Triages inbox; surfaces what matters, archives what doesn't
- Summarises threads to key points
- Drafts replies in the user's voice
- Tracks unanswered threads and flags them after a configurable period
- Sends only with explicit approval
- Optimises send timing for recipient timezone and patterns

**Dedicated address recommendation:** During onboarding, Jacq recommends setting up a dedicated send-from email address (e.g. `jacq@yourdomain.com`) for clearer attribution and better control over what Jacq sends and receives. This is optional and can be configured at any time.

### Pillar 4 — Relationships and Context

Jacq builds and maintains a rich understanding of the user's professional and personal network.

- Enriches contacts from email, calendar, and conversation patterns
- Tracks VIPs (high-priority contacts)
- Stores per-contact communication preferences (channel, tone, sign-off, SLA, what to avoid)
- Maintains open items per contact
- Remembers relationship history and introductions
- Surfaces upcoming occasions (birthdays, anniversaries)

---

## Onboarding Flow

Onboarding is a single, continuous experience — not a form sequence.

### Screen 1 — Sign In

Google OAuth. Minimal. Sets the tone: confident, calm, trusted.

### Screen 2 — Welcome Cutscene

A calm, unhurried welcome using the same warm palette as the rest of the product. Jacq's name appears large in Instrument Serif. Introductory copy is generous and inviting. Transitions naturally into the conversation.

### Screen 3 — Intro Conversation

Jacq interviews the user in a conversational format. No forms. Questions are asked one at a time. Everything captured is visibly saved to Memory as the conversation progresses. Topics covered:

- Name and role
- What most often slips through the cracks
- Working hours and quiet time preferences
- Email sign-off format

### Screens 4–5 — Connect Integrations (Chat-style)

Integration setup continues the same conversational format — same dark background, same strip header. Each integration gets its own screen. Jacq explains what it will do and what it will never do. The dedicated address recommendation is surfaced here naturally, not as a warning.

Integrations in onboarding order:
1. Gmail
2. Google Calendar

Additional integrations (Google Drive, etc.) are available in Settings post-onboarding.

---

## Control Panel Screens

### Memory

The source of truth for everything Jacq knows about the user. Preferences do not live in a settings form — they live here, expressed as natural-language statements, grouped into sections.

**Sections:** About me, Communication, Calendar and time, Working style

**Interaction model:** Read-only by default. All editing, additions, and corrections happen through the JBubble chat pattern — a small Jacq speech-bubble icon that appears next to each row and at the bottom of each section. Tapping it opens an in-app chat panel with that item pre-loaded as context.

### Tasks — Kanban

A four-column kanban board. Column filter chips at the top allow switching focus. Cards show: title, tags, Jacq's working note, and source. Each card has a JBubble icon for chatting about it directly. A dashed "Add task via Jacq" card sits at the bottom of each active column.

### Task Detail

Full context for a single task: status metadata, Jacq's working notes (including what Jacq is actively doing), sub-tasks (with owner tags for JJ vs Jacq), and people involved. JBubble icons appear on all rows, sub-tasks, and people. Add rows at the bottom of each section.

### Activity

A log of everything Jacq has done and is waiting on. Two areas:

- **Awaiting approval:** Items Jacq has prepared but not executed, pending user sign-off via Telegram. JBubble available to discuss or redirect.
- **Done today / Yesterday:** Timestamped log of completed actions, with item-level JBubble for context.

Also contains the autonomy level selector (Cautious / Balanced / Autonomous) and a pause button for all autonomous actions.

### Relationships

A contact list enriched from email, calendar, and conversations. Burger nav replaces the footer bar on this section. VIPs appear as expanded cards; others appear in a compact list. JBubble on each card and a section-level add row.

### Relationship Detail

Full context for one person: Jacq's context notes, per-contact communication preferences (channel, tone, sign-off, SLA, what to avoid), and open items. All editable via JBubble. Add rows at the bottom of each section.

### Settings

Compact row-based settings grouped into: Integrations, AI and Desktop, Communication style, Quiet hours, Performance and feedback, Privacy and data. JBubble appears on every non-destructive row. Destructive actions (delete all data) are flagged in red without a JBubble.

---

## Interaction Patterns

### JBubble

The core interaction pattern for the control panel. A small speech-bubble icon with a "J" inside, rendered in Jacq's gold accent colour. Two variants:

- **Standard** (speech bubble alone): appears at the end of every data row. Opens the in-app chat panel with that row as context.
- **Add** (speech bubble with a plus badge): appears as a footer at the bottom of each section group. Opens the chat panel to add a new item to that section.

Sits at 45% opacity by default; brightens to full on hover. Never intrusive — quiet until needed.

### In-App Chat Panel

Slides up from the bottom of any screen. The panel shows which screen and section it was opened from as context, so Jacq already knows what is being discussed. Same warm surfaces as every other screen. Input bar at the bottom. Closed with a handle swipe or the X button.

This is the same interaction model as onboarding — the user first meets Jacq through conversation, and continues to interact with Jacq this way throughout the product.

### Burger Navigation

A full-screen overlay accessible from every post-login screen via a three-line icon in the top navigation bar. Contains: section links (Memory, Tasks, Activity, Relationships, Settings), a dark/light mode toggle, a "Message Jacq" shortcut (opens Telegram), and the version number. The Relationships section uses burger nav as its primary navigation instead of a footer tab bar.

---

## Autonomy Framework

Jacq operates on a graduated trust model configurable by the user.

| Level | Description |
|-------|-------------|
| **Cautious** | Proposes actions only. Nothing executed without explicit approval. |
| **Balanced** | Drafts and prepares, then confirms before executing. Default starting point. |
| **Autonomous** | Executes within learned preferences. Reports back rather than asking. |

### Guardrails (always active regardless of autonomy level)

- External communications require approval on first send
- A 30-second undo window follows any autonomous send
- The daily activity log shows everything Jacq has done
- A kill switch pauses all autonomous actions instantly
- Financial transactions are never executed without explicit approval

### Autonomy Progression

Jacq starts at Balanced. Trust levels per action type can be promoted after repeated successful confirmations, and demoted if the user rejects an action or provides negative feedback.

---

## Proactive Features

### Morning Briefing (via Telegram)

Delivered at a user-configured time. Contents:
- Weather and suggested outfit (based on the day's events)
- Calendar at a glance with logistics and travel alerts
- Conflicts or concerns (double-bookings, tight transitions)
- Emails requiring attention
- Tasks due today
- One proactive thought (follow-up due, birthday coming, something Jacq noticed)

Target: readable in under 30 seconds.

### Smart Notifications (via Telegram)

| Trigger | Notification |
|---------|-------------|
| Important email arrives | "Email from [VIP]: [Subject] — Reply needed?" |
| Meeting in 15 min | "Client call in 15 min. Need prep notes?" |
| Gap in calendar | "2 hours free this afternoon — block focus time?" |
| Stale follow-up | "Still waiting on reply from X (sent 3 days ago)" |
| Travel required | "Leave in 30 min to make your 2pm in Shoreditch" |
| Task overdue | "Task X is overdue — reschedule or complete?" |

### Evening Wrap-up (optional, via Telegram)

- What got done
- What didn't (auto-reschedule offer)
- Anything unresolved
- Quick preview of tomorrow

### Weekly Reflection (via Telegram)

End-of-week check-in:
- Recap (meetings, tasks, follow-ups)
- "Anything I did that didn't land right?"
- "Any new preferences I should know?"
- Updates Memory based on the conversation

---

## Memory System

Memory is the foundation of Jacq's intelligence. It is not a database of settings — it is a living record of what Jacq has learned about the user, expressed in natural language.

**Memory types:**

| Type | Examples |
|------|---------|
| Personal context | Name, role, organisation, work hours |
| Communication preferences | Quiet hours, preferred channels, sign-off format, tone |
| Calendar preferences | Protected times, buffer rules, meeting length preferences |
| Working style | Stress signals, lunch preferences, decision-making style |
| Relationship context | Who's who, how they were introduced, what they prefer |
| Commitments and follow-ups | What was promised to whom, when |
| Project context | Background, decisions made, key contacts |

**Memory updates:** Through onboarding conversation, through weekly reflection, through in-app JBubble chat, and passively as Jacq observes patterns (approved by the user before storing).

---

## Communication Configuration

### Email Sign-off

Two configurable sign-offs:

- **Jacq acting as PA:** used when Jacq drafts and sends on behalf of the user. Default: *"Jacq, PA to [User Name]"*
- **Jacq drafting as user:** used when drafting in the user's voice. Default: the user's first name.

### Communication Style

Configurable in Settings and refineable through conversation:

- Tone (default: direct, warm, no filler)
- Response length (default: concise)
- Language (default: British English)

### Quiet Hours

Configurable start and end times, plus weekend behaviour. Default: no proactive messages before 08:00 or after 20:00; weekends off except emergencies.

---

## Settings Reference

| Group | Settings |
|-------|---------|
| Integrations | Gmail, Google Calendar, Google Drive, Telegram |
| AI and Desktop | Cloud LLM provider, Local LLM model, Desktop app status, Browser control |
| Communication style | Tone, Response length, Sign-off (as PA), Sign-off (as user), Language |
| Quiet hours | Start, End, Weekend behaviour |
| Performance and feedback | Weekly review schedule, Feedback channel, Version |
| Privacy and data | Local-only mode, Data export, Audit log, Delete all data |

---

## Desktop Application

### Menu Bar (collapsed)

- Jacq wordmark and active/inactive status
- Local model name and running state
- Token split today (local % / cloud %)
- Browser control toggle
- Current task (what Jacq is working on)
- Menu: Open dashboard / Pause Jacq / Model settings / Quit

### Expanded Panel

- Local LLM model selector (with per-model status: Running / Loaded / Idle, size, active indicator)
- Browser automation status (enabled/disabled, sessions today, pages visited)
- Token usage today (local vs cloud, with visual bar)
- System resources (RAM, storage, CPU)

---

## Development Phases

### Phase 1 — Foundation (8 weeks)

- Browser-based app shell with navigation
- Supabase backend and authentication (Google OAuth)
- Telegram bot setup and basic messaging
- Memory data model and basic CRUD
- Onboarding flow (cutscene → conversation → integrations)

**Milestone:** User can onboard, Jacq can send and receive messages via Telegram

### Phase 2 — Integration (6 weeks)

- Gmail read / triage / summarise / draft / send
- Google Calendar read / write / conflict detection
- Web search and URL fetch
- Tool-use framework
- Basic memory storage and recall

**Milestone:** Jacq can manage calendar and email, memory is live

### Phase 3 — Control Panel (6 weeks)

- Memory screen (full read/edit via JBubble)
- Tasks kanban (extraction from email, manual add)
- Activity log
- Relationships screen
- In-app chat panel (JBubble pattern)
- Burger nav and dark/light mode

**Milestone:** Full control panel live

### Phase 4 — Proactivity (6 weeks)

- Morning briefing
- Smart notifications via Telegram
- Email importance detection
- Meeting reminders and travel alerts
- Evening wrap-up
- Pattern learning foundations

**Milestone:** Jacq proactively reaches out with useful, contextualised information

### Phase 5 — Intelligence (6 weeks)

- Trust framework and autonomy levels
- Autonomous email drafting and sending
- Calendar conflict resolution
- Follow-up tracking
- Commitment extraction from conversations
- Multi-provider LLM support
- Desktop app with local LLM

**Milestone:** Jacq executes tasks autonomously with appropriate guardrails

### Phase 6 — Polish and Launch (4 weeks)

- Performance optimisation
- Offline handling
- App Store / Play Store (if applicable)
- Onboarding refinement
- Documentation and support infrastructure

---

## Success Metrics

### Engagement

| Metric | Target (Month 3) |
|--------|-----------------|
| DAU / MAU | > 40% |
| Telegram messages per day | > 5 |
| Control panel sessions per week | > 3 |
| D7 retention | > 50% |
| D30 retention | > 30% |

### Autonomy and Trust

| Metric | Target |
|--------|--------|
| Autonomous actions per user/day | > 5 |
| Action approval rate | > 85% |
| Undo rate | < 5% |
| Trust level promotions/month | > 20% of actions |

### Proactivity

| Metric | Target |
|--------|--------|
| Morning briefing open rate | > 60% |
| Notification action rate | > 20% |
| Suggestions accepted | > 15% |

### Memory Quality

| Metric | Target |
|--------|--------|
| Context retrieval accuracy | > 90% |
| "I already told you" complaints | < 1/week |
| Commitment completion rate | > 95% |

---

## Open Questions

1. **Pricing model:** Freemium with limits? Flat subscription? Usage-based? BYOK discount?
2. **Microsoft 365:** Include in v1 or defer?
3. **Desktop platforms:** macOS first, then Windows? Linux?
4. **Team and family features:** Shared context, delegate access?
5. **Voice assistant integration:** Siri / Google Assistant shortcuts?
6. **Telegram alternatives:** WhatsApp, iMessage — future channels?

---

## Appendix: Tool Definitions

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  autonomyDefault: 'full' | 'supervised' | 'suggested' | 'never';
  execute: (params: any, ctx: Context) => Promise<ToolResult>;
}
```

| Tool | Description | Default Autonomy |
|------|-------------|-----------------|
| `calendar.list` | List events for date range | full |
| `calendar.create` | Create new event | supervised |
| `calendar.update` | Modify existing event | supervised |
| `calendar.delete` | Delete event | supervised |
| `calendar.find_free` | Find available slots | full |
| `calendar.block_travel` | Auto-block travel time | full (after learning) |
| `email.search` | Search emails | full |
| `email.read` | Read email content | full |
| `email.summarise` | Summarise thread | full |
| `email.triage` | Categorise and prioritise inbox | full |
| `email.draft` | Draft email or reply | supervised |
| `email.send` | Send email | supervised |
| `web.search` | Web search | full |
| `web.fetch` | Fetch URL content | full |
| `web.research` | Multi-query deep research | supervised |
| `tasks.list` | List tasks | full |
| `tasks.create` | Create task | full |
| `tasks.update` | Update task status or notes | full |
| `tasks.complete` | Mark task done | full |
| `memory.store` | Save to memory | full |
| `memory.search` | Search memory | full |
| `memory.update` | Update existing memory | supervised |
| `contacts.get` | Get contact details | full |
| `contacts.enrich` | Update contact from signals | supervised |
| `commitment.create` | Log a commitment | full |
| `commitment.complete` | Mark commitment done | full |
| `telegram.send` | Send message via Telegram | supervised |

---

*End of Specification*
