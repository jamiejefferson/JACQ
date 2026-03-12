# Jacq — Functional Specification

**Version:** 1.0
**Date:** 10 March 2026
**Authors:** JJ / Santy

> This document is the developer-facing companion to the Product Specification. It covers every post-login screen, component, modal, interaction, data contract, edge state, and navigation flow needed to build the Jacq control panel web app.

---

## Contents

1. [Global Architecture](#1-global-architecture)
2. [Design System and Shared Components](#2-design-system-and-shared-components)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Understanding Screen](#4-understanding-screen)
5. [Tasks — Kanban](#5-tasks--kanban)
6. [Task Detail](#6-task-detail)
7. [Activity Screen](#7-activity-screen)
8. [Relationships](#8-relationships)
9. [Relationship Detail](#9-relationship-detail)
10. [Settings](#10-settings)
11. [Desktop App](#11-desktop-app)
12. [Burger Nav Overlay](#12-burger-nav-overlay)
13. [In-App Chat Panel](#13-in-app-chat-panel)
14. [Modals and Micro-flows](#14-modals-and-micro-flows)
15. [Data Models](#15-data-models)
16. [API Reference](#16-api-reference)
17. [Navigation and Routing](#17-navigation-and-routing)
18. [Empty States](#18-empty-states)
19. [Error States](#19-error-states)

---

## 1. Global Architecture

### Technology Stack (recommended)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 14 (App Router) | Mobile-first, SSR for auth, client components for interactive UI |
| Styling | Tailwind CSS + CSS variables for design tokens | No component library — custom components throughout |
| State | Zustand | Global app state (user, preferences, active screen) |
| Server state | TanStack Query | Data fetching, caching, optimistic updates |
| Auth | Supabase Auth + Google OAuth | Handles token storage and refresh |
| Database | Supabase (Postgres) | All app data |
| Realtime | Supabase Realtime | Live updates to Activity, Commitments |
| AI | Anthropic Claude API (cloud) + Ollama (local via desktop) | Routed by complexity |
| Telegram | Telegram Bot API | Push channel for all proactive messaging |
| Payments | Stripe | Pro tier billing |

### App Shell

The post-login app is a mobile-first single-page application rendered within a fixed viewport (375px max-width, full height).

**Shell layout:**

```
┌─────────────────────┐
│  Status bar (46px)  │
├─────────────────────┤
│  Top nav (44px)     │
├─────────────────────┤
│                     │
│  Screen content     │
│  (flex: 1,          │
│   overflow: auto)   │
│                     │
├─────────────────────┤
│  Bottom tab (68px)  │  ← Control Panel screens only
└─────────────────────┘
```

**Global state (Zustand store):**

```typescript
interface AppState {
  user: User | null
  darkMode: boolean
  activeChatContext: ChatContext | null  // what JBubble was tapped
  isChatPanelOpen: boolean
  isBurgerOpen: boolean
  toggleDarkMode: () => void
  openChat: (context: ChatContext) => void
  closeChat: () => void
}
```

### Authentication Flow

1. User visits `/` — redirected to `/signin` if no session
2. Google OAuth via Supabase — scopes: `email`, `profile`, `gmail.readonly` (expanded post-onboarding), `calendar`
3. On success, session stored in Supabase Auth
4. Redirect to `/onboarding` if `onboarding_complete = false`, else `/understanding`
5. All API routes protected with Supabase middleware session check

### Dark / Light Mode

- Default: light
- User preference stored in `users.preferences.dark_mode` (boolean)
- CSS custom properties updated on toggle, no page reload
- Respects `prefers-color-scheme` on first load, then user preference takes over

---

## 2. Design System and Shared Components

### Design Tokens

All tokens as CSS custom properties on `:root` and `[data-theme="dark"]`.

```css
:root {
  --bg: #F5F2EC;
  --surf: #FFFFFF;
  --surf2: #EDE8E1;
  --surf3: #E3DDD5;
  --bord: rgba(0,0,0,0.08);
  --bord2: rgba(0,0,0,0.04);
  --t1: #1A1710;
  --t2: #7A7268;
  --t3: #AEA79E;
  --gold: #B8935A;
  --goldl: rgba(184,147,90,0.10);
  --goldb: rgba(184,147,90,0.22);
  --green: #3A9468;
  --greenl: rgba(58,148,104,0.10);
  --amber: #C07B28;
  --amberl: rgba(192,123,40,0.10);
  --red: #C0443A;
  --redl: rgba(192,68,58,0.08);
  --blue: #3060B8;
  --bluel: rgba(48,96,184,0.08);
}

[data-theme="dark"] {
  --bg: #131108;
  --surf: #1C1A12;
  --surf2: #242218;
  --surf3: #2C2A20;
  --bord: rgba(255,255,255,0.07);
  --bord2: rgba(255,255,255,0.03);
  --t1: #EDE8DF;
  --t2: #787060;
  --t3: #48443C;
}
```

### Typography

```css
/* Logo — used only for the Jacq wordmark */
font-family: 'Instrument Serif', Georgia, serif;
font-style: italic;
font-weight: 400;

/* Jacq's voice — section titles, screen headings, Jacq's chat messages */
font-family: 'Gilda Display', Georgia, serif;
font-weight: 400;

/* Body and UI */
font-family: 'DM Sans', -apple-system, sans-serif;

/* Metadata, timestamps, mono labels */
font-family: 'DM Mono', monospace;
```

Google Fonts import: `Instrument+Serif:ital@1&family=Gilda+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400`

---

### Component: JacqLogo

```typescript
interface JacqLogoProps {
  size?: number        // default 22
  color?: string       // default var(--gold)
}
```

Renders `<span>Jacq</span>` in Instrument Serif italic. Never bold. Never uppercase. Used in: sign-in, cutscene, onboarding strip headers, burger nav, desktop app.

---

### Component: SectionLabel (`SL`)

```typescript
interface SLProps {
  children: string
}
```

Gilda Display, 13px, `var(--t1)`. Padding: 14px top, 6px bottom, 18px horizontal. Used as group headers within scrollable screen content.

---

### Component: DataRow

```typescript
interface DataRowProps {
  label: string          // DM Mono, 11px, var(--t3), 112px wide
  value: string          // DM Sans, 13px, var(--t1) if confirmed | var(--t2) if inferred
  inferred?: boolean     // shows amber left border + Confirm? affordance
  onConfirm?: () => void
  onJBubble?: () => void // opens chat panel with this row as context
  showDivider?: boolean
}
```

**Inferred variant:** 2px amber left border, value in `var(--t2)`, "Confirm?" text (12px, amber, DM Sans, 600 weight) to the left of JBubble. `onConfirm` calls `PATCH /api/understanding/:id` with `{ source: 'confirmed' }`.

---

### Component: JBubble

```typescript
interface JBubbleProps {
  size?: number      // default 20
  add?: boolean      // plus badge variant for section footers
  context?: ChatContext  // pre-loaded when chat panel opens
  onOpen?: () => void
}
```

Speech bubble SVG with "J" inside. `var(--gold)`. Opacity 0.45 at rest, 1.0 on hover/focus. On tap: calls `openChat(context)` on the global Zustand store, which sets `isChatPanelOpen = true` and `activeChatContext = context`.

**ChatContext shape:**
```typescript
interface ChatContext {
  screen: string         // e.g. 'understanding', 'tasks', 'activity'
  section?: string       // e.g. 'communication', 'commitments'
  itemId?: string        // specific record ID if tapping a row
  itemLabel?: string     // human-readable label for pre-loaded context
  prefill?: string       // optional message pre-filled in input
}
```

---

### Component: TopNav (`TNav`)

```typescript
interface TNavProps {
  title: string
  sub?: string
  back?: boolean         // shows back button (square, surf2)
  action?: string        // right-side text action in gold
  onAction?: () => void
  burger?: boolean       // shows burger icon
  onBurger?: () => void
}
```

Height: 44px. Title in Gilda Display 17px. Sub in DM Sans 11px `var(--t2)`. Back button is `router.back()`. Burger opens `BurgerOverlay`.

---

### Component: BottomNav (`BNav`)

```typescript
interface BNavProps {
  active: 'memory' | 'tasks' | 'activity' | 'settings'
  onNav: (screen: string) => void
}
```

Height: 68px. Tabs: Understanding (id: memory), Tasks, Activity, Settings. Active: gold icon + label. Inactive: `var(--t3)`. Tapping navigates to that screen's root route.

---

### Component: Tag

```typescript
interface TagProps {
  color: string     // pill background is color at 16% opacity, text at full
  children: string
}
```

Border radius: 99px. Padding: 2px 7px. Font: DM Sans 10.5px 600.

---

### Component: Hr (divider)

1px `var(--bord2)` horizontal rule. Margin: 0 14px by default. Used between rows within section cards.

---

## 3. Onboarding Flow

### Route: `/signin`

**Purpose:** Entry point for new and returning users.

**Layout:** Full screen, `var(--bg)` background. Centred content.

**Elements:**
- JacqLogo at 62px, centred
- 32px gold divider line below logo
- Tagline: "Your PA. Working before you ask." — DM Sans 13px `var(--t2)`, max-width 200px, centred
- Google sign-in button: white background, Google G icon, "Sign in with Google" label
- Supabase `signInWithOAuth({ provider: 'google', scopes: 'email profile' })`

**After auth:**
- Check `users.onboarding_complete`
- If false → `/onboarding/welcome`
- If true → `/understanding`

**Error state:** If OAuth fails, show inline error below button: "Something went wrong. Please try again." Red text, DM Sans 12px.

---

### Route: `/onboarding/welcome` (Cutscene)

**Purpose:** Set the relationship frame — Jacq is a colleague, not a tool.

**Layout:** Full screen, `var(--bg)`. No navigation chrome.

**Sequence (auto-advancing or tap to advance):**
1. JacqLogo fades in at 72px, centred. 1s fade.
2. After 1.5s: Gilda Display 24px copy fades in: "I'm Jacq."
3. After 1s: second line fades in: "I'm going to handle your admin, protect your time, and follow up on everything you forget to chase."
4. After 1.5s: third line: "You don't need to open an app. I'll come to you."
5. "Let's get started →" CTA appears — DM Sans 14px 600, dark background pill. Tap navigates to `/onboarding/conversation`.

**Skip:** Small "Skip intro" link bottom-right, `var(--t3)`, navigates directly to conversation.

---

### Route: `/onboarding/conversation`

**Purpose:** Jacq's initial interview. First experience of the conversational interface.

**Layout:**
- Slim strip header: JacqLogo 26px left, "Getting to know you" label right in DM Sans 11px `var(--t3)`
- Scrollable message list (flex: 1)
- CTA button at bottom (appears after all questions answered)

**Conversation sequence (scripted):**

Each JMsg uses Gilda Display 20px, no bubble. UMsg uses `var(--surf2)` rounded box 18px radius, DM Sans 15px. Memory saves appear inline as gold confirmation panels.

```
JMsg: "Before I get started, I'd like to ask you a few things. 
       It'll only take a couple of minutes — and everything you 
       tell me, I'll remember."

JMsg (follow): "What's your name, and what do you do? Don't 
               overthink it — how would you describe yourself at 
               a dinner?"

[User types response — free text input]
[Jacq extracts: name, role. Saves inline with "Saved to understanding" panel]

JMsg: "Got it. And what's the thing that most often slips through 
       the cracks — the admin you wish someone else was handling?"

[User types response — free text input]
[Jacq saves priority/pain point]

JMsg: "What time do you usually start work, and is there any time 
       that's off-limits for me to reach out?"

[User types response]
[Jacq saves work hours, quiet hours inline]

JMsg: "One more — how should I sign off messages I send on your 
       behalf?"

[User types response]
[Jacq saves sign-off format]

JMsg (time="Now"): "Perfect. One last step — I need to connect to 
                   your Google account. I'll open a browser, you 
                   tap Allow, and we're done. Then I'll check in 
                   again over the next few days as I get to know 
                   you better."
[Saved panel: sign-off confirmation]
```

**Input handling:**
- Text input fixed at bottom, auto-focuses after each JMsg sequence
- "Send" button or Enter submits
- Each response sent to `/api/onboarding/process-message` which runs through LLM to extract structured data and returns both a JMsg reply and any understanding entries to save
- Saved entries POSTed to `/api/understanding` with `source: 'told'`

**After final message:** CTA button slides up: "Connect my accounts →". Navigates to `/onboarding/connect`.

**Week-1 check-in scheduling:** On completion, server schedules 5 Telegram messages (days 2, 3, 4, 5, 7) via the scheduler service.

---

### Route: `/onboarding/connect`

**Purpose:** Single Google workspace consent covering Gmail, Calendar, and Contacts.

**Layout:** Same strip header. Chat-style content.

**Scripted messages:**
```
JMsg: "Last step. I need access to your Google account — email, 
       calendar, and contacts. It's one approval that covers 
       everything."

JMsg (follow): "I'll open a browser. Just sign in and tap Allow 
               on the Google screen, then come straight back here."
```

**Access card:** Shows Gmail / Calendar / Contacts with one-line description each. Non-interactive.

**Dedicated address callout:** Gold-tinted panel. "One thing worth considering: setting up a dedicated send-from address like `jacq@yourdomain.com` keeps things clearly attributed. Entirely optional — easy to add later."

**Guardrail note:** Green-tinted panel. "I will never send, delete, or book anything without your approval first."

**CTA:** "Connect Google" button — triggers `signInWithOAuth` with additional Gmail + Calendar scopes. On success, stores access token in Supabase `user_integrations` table. Redirects to `/understanding` and sets `users.onboarding_complete = true`.

**Skip:** "Skip for now" ghost link. Records `integration_deferred = true`. Redirects to `/understanding`. Jacq will prompt again via Telegram on day 2.

---

### Week-1 Check-ins (Telegram, server-side)

Not a UI screen, but must be implemented. Server scheduler sends Telegram messages on:

| Day | Message |
|-----|---------|
| 2 | "Tell me about your typical week — what does a normal Monday look like?" |
| 3 | "Who are the most important people in your work life right now?" |
| 4 | "What frustrates you most about how things currently work for you?" |
| 5 | "How do you prefer to communicate — email, calls, async?" |
| 7 | "Here's what I've learned so far. [Summary of Understanding entries]. Anything I got wrong?" |

User replies processed by the Telegram webhook → LLM extraction → `PATCH /api/understanding` with new entries, source `'told'`.

---

## 4. Understanding Screen

**Route:** `/understanding`
**Tab:** Understanding (id: memory)

### Purpose

Jacq's living picture of the user. Not a settings page — a transparent, editable model of who the user is. Every entry has a source (told directly or inferred from behaviour). Richness grows over time.

### Layout

```
StatusBar
TopNav (title: "Understanding", sub: "Jacq's picture of you", burger)
─────────────────────────────────────────────
Weekly Learning Card (conditional — see below)
Richness Indicator
"Teach Jacq something new" CTA row
Search bar
─────────────────────────────────────────────
Scrollable content:
  SL "About me"
  Section card: DataRows
  SL "Communication"
  Section card: DataRows
  SL "Calendar & time"
  Section card: DataRows
  SL "Working style"
  Section card: DataRows
─────────────────────────────────────────────
BottomNav (active: memory)
```

### Weekly Learning Card

**Condition:** Shown when `weekly_learning_reviews` table has a review with `status = 'pending'` for this user and `scheduled_for <= now()`.

**Appearance:** Gold `var(--goldl)` background, `var(--goldb)` border, 14px border radius. Left side: "Weekly learning · ready to review" label (DM Sans 12px 600 gold) + body copy ("This week I picked up X things about how you work. Want to review them?"). Right side: "Review" button (gold filled, 11px white text).

**On tap "Review":** Opens in-app chat panel with `context = { screen: 'understanding', section: 'weekly-review', itemId: review.id, prefill: 'Let\'s review what you learned this week.' }`. Sets `weekly_learning_reviews.status = 'in_progress'`.

**After review complete:** Card disappears. Next review scheduled for following Sunday.

### Richness Indicator

```
"Jacq understands 34 things about you. 18 were inferred from how you work."
```

DM Sans 12px `var(--t2)`. "18 were inferred" is tappable — opens Understanding screen filtered to show only inferred entries. Count calculated from `understanding_entries` table.

### "Teach Jacq something new" CTA

A full-width tappable row (not a button). `var(--surf)` background, 12px border radius, `var(--bord)` border. JBubble (add variant) on left. "Teach Jacq something new" DM Sans 13px. Chevron right on far right.

**On tap:** Opens in-app chat panel with `context = { screen: 'understanding', section: 'new', prefill: '' }`. No pre-loaded item. Fresh conversation. User types anything; LLM extracts and creates new understanding entries with `source: 'told'`.

### Search Bar

Height 36px, `var(--surf)` background, `var(--bord)` border, 10px border radius. Placeholder: "Search understanding…" DM Sans 13px `var(--t3)`.

**Behaviour:** Filters displayed entries client-side on `label` and `value` fields. Minimum 2 characters to activate. No API call — data already fetched.

### Sections

**Data fetch:** `GET /api/understanding` returns all entries grouped by section. Cached by TanStack Query, stale time 60s.

**Sections:** About me / Communication / Calendar & time / Working style

Each section renders as a card (`var(--surf)` background, 14px border radius, `var(--bord)` border, overflow hidden). Rows separated by `Hr`. Section footer: JBubble (add variant) + "Add to [section name] via Jacq" label.

**Told entries:** Standard DataRow. Label: DM Mono 11px `var(--t3)`. Value: DM Sans 13px `var(--t1)`. JBubble right.

**Inferred entries:** DataRow with `inferred={true}`. 2px amber left border. Value in `var(--t2)`. "Confirm?" affordance (12px amber DM Sans 600) before JBubble. On tap "Confirm?": calls `PATCH /api/understanding/:id` `{ source: 'confirmed' }`. Row immediately updates to told styling (optimistic update).

**JBubble on row:** Opens chat panel with `context = { screen: 'understanding', section: entry.section, itemId: entry.id, itemLabel: entry.label }`. Chat panel shows current value, allows edit or deletion.

**JBubble (add) on section footer:** Opens chat panel with `context = { screen: 'understanding', section: section.label, prefill: 'I want to add something to my ' + section.label + ' preferences.' }`.

### Understanding Entry — Edit Flow

When user discusses a row via the chat panel:
1. LLM identifies intent (edit value / delete / add related)
2. On edit: shows proposed new value in chat, user confirms
3. On confirm: `PATCH /api/understanding/:id` `{ value: newValue }` — optimistic update in UI
4. On delete: `DELETE /api/understanding/:id` — row animates out
5. "Saved to understanding" gold panel appears inline in chat

### Empty State

First login after onboarding: show 4 empty section cards with placeholder text: "Nothing here yet — I'll fill this in as I get to know you." No search bar or richness indicator until at least 5 entries exist.

---

## 5. Tasks — Kanban

**Route:** `/tasks`
**Tab:** Tasks

### Purpose

Jacq's active work surface. Shows every task Jacq is tracking: extracted from emails, added by the user via chat, or created by Jacq during autonomous work.

### Layout

```
StatusBar
TopNav (title: "Tasks", sub: "Jacq's work surface", action: "+ Add", burger)
Column filter chips (horizontal scroll)
─────────────────────────────────────────────
Scrollable content:
  [For each column with cards:]
  SL "Column name · count"
  [Cards]
  Add card (dashed)
─────────────────────────────────────────────
BottomNav (active: tasks)
```

### Column Filter Chips

Horizontal scrollable row. Chips: To Do / Jacq Acting / Waiting / Done. Each chip has a 6px colour dot + label. Active chip: gold background (`var(--goldl)`), gold border, gold text. Inactive: `var(--surf)`, `var(--bord)` border, `var(--t2)` text.

**Behaviour:** Tapping a chip scrolls the main list to that column section. Does not hide other columns — it's navigation, not filtering.

### Columns

| Column | Colour | Meaning |
|--------|--------|---------|
| To Do | `var(--t3)` | Identified, not started |
| Jacq Acting | `var(--gold)` | Jacq is actively working |
| Waiting | `var(--amber)` | Jacq has sent/acted, awaiting external response |
| Done | `var(--green)` | Completed (shown as this-week log only) |

**Data fetch:** `GET /api/tasks?status=all` — returns all tasks grouped by status. Realtime subscription on `tasks` table for live updates when Jacq moves a card.

### Task Card

```typescript
interface TaskCardProps {
  id: string
  title: string           // DM Sans 13px 600 var(--t1)
  tags: string[]          // Tag components
  note: string            // Jacq's working note — DM Sans 12px var(--t2)
  source: string          // DM Mono 11px var(--t3) — "From: Sarah's email"
  column: ColumnId
}
```

Card: `var(--surf)` background, 14px border radius, `var(--bord)` border, 12px padding. JBubble in top-right of title row. Tags row below. Jacq's note below tags. Source metadata at bottom.

**JBubble on card:** Opens Task Detail screen (push navigation) AND opens chat panel simultaneously with `context = { screen: 'tasks', itemId: task.id, itemLabel: task.title }`.

**Tap on card body:** Navigates to Task Detail.

**Long-press on card:** Drag to reorder within column (MVP: not implemented — use chat instead).

### Add Card (section footer)

Dashed border `var(--bord)`, no background fill, 14px radius. JBubble (add variant) + "Add task via Jacq" label. On tap: opens chat panel with `context = { screen: 'tasks', section: column.label, prefill: 'I want to add a task to ' + column.label }`.

### "+ Add" Action (TopNav)

On tap: opens chat panel with `context = { screen: 'tasks', prefill: 'I want to add a new task.' }`.

### Done Column

Shows only tasks completed in the past 7 days. Collapsed by default — "Done this week · N" header with chevron to expand. Completed tasks shown with green tick, strikethrough title, DM Mono timestamp.

### Empty States

- All columns empty: "No tasks yet. I'll extract action items from your emails automatically, or you can add one now." + "Add task via Jacq" button.
- Single column empty: show only add card, no section label.

---

## 6. Task Detail

**Route:** `/tasks/:id`

### Purpose

Full context for one task. Everything Jacq knows and is doing. User can discuss any element via JBubble.

### Layout

```
StatusBar
TopNav (title: task.title, back, burger)
─────────────────────────────────────────────
Scrollable content:
  Status metadata strip
  Jacq's working notes (gold panel)
  SL "Sub-tasks"
  Sub-task list
  SL "People involved"
  People list
  [Add rows at bottom of each section]
─────────────────────────────────────────────
BottomNav (active: tasks)
```

### Status Metadata Strip

Single row: Column tag (coloured) · Source · Created date · Due date (if set). DM Mono 11px `var(--t3)`. All tappable via JBubble.

### Jacq's Working Notes

Gold `var(--goldl)` panel, `var(--goldb)` border, 10px radius. Header: "Jacq is working on this" — DM Sans 11px 600 gold. Body: current working note from `tasks.working_note` — DM Sans 12px `var(--t2)`.

Updated in realtime as Jacq works. If Jacq has completed action and is waiting: header changes to "Jacq is waiting on" with amber styling.

JBubble on panel → opens chat to discuss or redirect Jacq's approach.

### Sub-tasks

Each sub-task row:
- Checkbox (16×16px, 5px border radius, `var(--bord)`)
- Task text DM Sans 13px — `var(--t3)` + strikethrough if done, `var(--t1)` if pending
- Owner tag: "JJ" (blue) or "Jacq" (gold)
- JBubble

**On checkbox tap:** If `owner = 'JJ'` → `PATCH /api/tasks/:id/subtasks/:subId` `{ done: true }`. If `owner = 'Jacq'` → opens chat to confirm with Jacq first.

**Add sub-task:** Footer JBubble (add variant) + "Add sub-task via Jacq". Opens chat with `context = { screen: 'task-detail', section: 'subtasks', itemId: task.id }`.

### People Involved

Avatar (28px circle, initials, coloured background) + name (DM Sans 13px 600) + role (DM Sans 11px `var(--t2)`) + JBubble.

On avatar tap: navigates to Relationship Detail for that person.

**Add person:** Footer JBubble (add) + "Add person via Jacq".

---

## 7. Activity Screen

**Route:** `/activity`
**Tab:** Activity

### Purpose

The accountability screen. Three distinct sections: what Jacq has committed to, what Jacq has done, and what Jacq has noticed. Expresses all three differentiating pillars simultaneously.

### Layout

```
StatusBar
TopNav (title: "Activity", sub: "Commitments, actions and patterns", burger)
─────────────────────────────────────────────
Scrollable content:
  [SECTION 1] Commitments
    Completion rate strip
    Active commitment cards
    "Completed this week · N" (collapsible)

  [SECTION 2] Actions taken today
    Timestamped action log

  [SECTION 3] Patterns observed
    Pattern observation cards

  [SECTION 4] Autonomy level
    Three-option selector
    Pause button
─────────────────────────────────────────────
BottomNav (active: activity)
```

### Section 1: Commitments

**Data fetch:** `GET /api/commitments?status=active` and `GET /api/commitments?status=completed&period=week`

**Realtime:** Supabase subscription on `commitments` table — updates live when Jacq fulfils or creates commitments.

#### Completion Rate Strip

Full-width `var(--surf)` card. Left: "This week's completion rate" DM Sans 12px `var(--t2)`. Right: percentage in DM Mono 15px 700.

Colour rules:
- 100%: `var(--green)`
- 80–99%: `var(--amber)`
- < 80%: `var(--red)`

#### Active Commitment Cards

```typescript
interface CommitmentCard {
  id: string
  title: string          // DM Sans 13px 600 var(--t1)
  source: string         // "From Telegram, 10 Mar 09:14" — DM Mono 11px var(--t3)
  due: Date
  status: 'pending' | 'in_progress' | 'completed' | 'missed'
}
```

Card: `var(--surf)` background, 12px radius, `var(--bord)` border, 11px padding.

Due date formatting:
- > 48h away: DM Mono 11px `var(--t3)`
- Within 24h: DM Mono 11px amber 600
- Overdue: DM Mono 11px red 600

JBubble on card → opens chat to discuss, reschedule, or mark done. `context = { screen: 'activity', section: 'commitments', itemId: commitment.id, itemLabel: commitment.title }`.

#### Completed This Week

Collapsible row: "Completed this week · N" with expand chevron. DM Sans 12px `var(--t2)`, green tick icon. Expanded: list of completed commitment titles with green tick + timestamp. JBubble on each.

#### Missed Commitments (conditional)

If any commitments have `status = 'missed'`: shown as a separate group above Active, red left border, "Missed · N" header. Jacq will have sent an explanation via Telegram, but the user can view it here. JBubble to discuss.

---

### Section 2: Actions Taken

**Data fetch:** `GET /api/activity-log?period=today` — returns timestamped log of all autonomous and semi-autonomous actions.

Each row in a section card (`var(--surf)`, 14px radius):
- Green tick icon (13px)
- Action description: DM Sans 12px `var(--t1)` flex:1
- Type tag (Email / Calendar / Task / Research / Message)
- Timestamp: DM Mono 10px `var(--t3)` right-aligned
- JBubble

JBubble → opens chat with `context = { screen: 'activity', section: 'actions', itemId: log.id, itemLabel: log.description }`. User can ask "why did you do this?" or "undo this".

**Undo:** For actions within 30 minutes, chat panel shows an "Undo" option. `POST /api/activity-log/:id/undo`. Not available for actions older than 30 minutes.

**Yesterday toggle:** At the bottom of the Actions section: "Yesterday" collapsible. Same structure.

---

### Section 3: Patterns Observed

**Data fetch:** `GET /api/patterns?status=pending` — patterns Jacq has observed but not yet acted on, awaiting user confirmation.

Each pattern card:
- Left border: 3px `var(--gold)`
- Body text: DM Sans 12px `var(--t1)` — conversational observation phrased as a question
- Type tag bottom-left (Calendar / Email / etc.)
- "Observed [time]" bottom-right: DM Mono 11px `var(--t3)`
- JBubble bottom-right

JBubble → opens chat with the pattern as context. User can say "yes do that", "no", or "do it but differently". Response updates `patterns.status` to `'confirmed'` or `'dismissed'`, and creates an understanding entry or autonomy rule if confirmed.

**Pattern dismissed:** Row fades out and is removed from list. Pattern stored as `dismissed` — Jacq will not surface it again unless the behaviour continues.

---

### Section 4: Autonomy Level

Three-option selector: Cautious / Balanced / Autonomous.

```typescript
type AutonomyLevel = 'cautious' | 'balanced' | 'autonomous'
```

Active option: `var(--goldl)` background, `var(--goldb)` border, gold text. Inactive: `var(--surf2)` background, `var(--t3)` text.

On change: `PATCH /api/users/preferences` `{ autonomy_level: newLevel }`. JBubble opens chat to discuss what the level means.

**Pause button:** Full-width red-tinted button: "Pause all autonomous actions". On tap: confirmation modal (see Section 14). On confirm: `POST /api/users/pause-autonomy`. Jacq stops all autonomous actions immediately. Telegram message sent: "Autonomous actions paused. I'll still monitor and alert you, but I won't act without asking first."

**Resuming:** Pause button changes to "Resume autonomous actions" (green tint). Or user can message Jacq via Telegram.

---

## 8. Relationships

**Route:** `/relationships`

### Purpose

Everyone Jacq knows about. No bottom tab bar — accessed via burger nav only. JBubble throughout for adding context, correcting information, or having Jacq research someone.

### Layout

```
StatusBar
TopNav (title: "Relationships", sub: "People Jacq knows about", burger)
Search bar
─────────────────────────────────────────────
Scrollable content:
  SL "VIPs · N"
  VIP cards (expanded)
  SL "Others · N"
  Others list (compact)
  Add row (JBubble add + "Add relationship via Jacq")
─────────────────────────────────────────────
[No bottom nav]
```

### Search

Height 36px. Searches `contacts.name`, `contacts.role`, `contacts.organisation` client-side. Shows results mixed (VIPs and Others). Minimum 2 characters.

### Data Fetch

`GET /api/contacts` — returns all contacts with fields: `id`, `name`, `role`, `organisation`, `is_vip`, `open_items_count`, `last_contact_at`, `alert` (birthday/occasion string), `initials`, `colour` (avatar background hex).

Contacts sorted: VIPs first (by last_contact_at desc), then Others (alphabetical).

### VIP Cards (Expanded)

```typescript
interface VIPCard {
  name: string
  role: string
  openItemsCount: number
  lastContact: string        // "Today", "2d ago", etc.
  alert?: string             // "🎂 3 days"
  initials: string
  colour: string             // avatar hex
}
```

Card: `var(--surf)` background, 14px radius, 12px padding, `var(--bord)` border.

Top row: avatar (36px circle, initials, `colour` background) + name (DM Sans 14px 600) + role (DM Sans 12px `var(--t2)`) + JBubble.

Bottom row: tags — open items count (amber if > 0), last contact, alert badge (green).

**On tap:** Navigates to `/relationships/:id`.

JBubble → opens chat with `context = { screen: 'relationships', itemId: contact.id, itemLabel: contact.name }`. User can ask "what's outstanding with Sarah?" or "tell me about the last time we spoke".

### Others List (Compact)

Single-line rows: small avatar (28px) + name + role + JBubble. `var(--surf)` section card, rows separated by `Hr`.

**On tap:** Navigates to `/relationships/:id`.

### Add Relationship

Footer row: JBubble (add) + "Add relationship via Jacq". Opens chat: `context = { screen: 'relationships', section: 'new' }`. User describes the person; Jacq creates a contact record and asks clarifying questions.

### Promoting to VIP

Via chat only. User says "make [name] a VIP" → `PATCH /api/contacts/:id` `{ is_vip: true }`. Card moves to VIP section (animated).

---

## 9. Relationship Detail

**Route:** `/relationships/:id`

### Layout

```
StatusBar
TopNav (title: contact.name, sub: contact.role, back, burger)
─────────────────────────────────────────────
Scrollable content:
  Header card (avatar, name, role, tags)
  Relationship signals strip (read-only)
  SL "Jacq's context"
  Context section card (DataRows)
  SL "Communication preferences"
  Preferences section card (DataRows)
  SL "Open items"
  Open items list
─────────────────────────────────────────────
[No bottom nav]
```

### Header Card

Avatar (44px), name in Gilda Display 16px, role DM Sans 12px `var(--t2)`. Tags: VIP (gold), birthday/occasion (green), open items count (amber). JBubble top-right for general contact chat.

### Relationship Signals Strip

Read-only — no JBubble. Three columns separated by `var(--bord2)` dividers:
- **Response rate:** "Fast (< 1hr)" / "Normal (1-4hr)" / "Slow (days)" — calculated from email timestamps
- **Meets:** "Weekly" / "Monthly" / "Occasional" / "Rare" — from calendar frequency
- **Last contact:** "Today" / "N days ago" / "N weeks ago" — from max(last email, last meeting)

Label: DM Mono 10px `var(--t3)`. Value: DM Sans 12px 600 `var(--t1)`.

**Data:** Computed server-side by the background analytics job. `GET /api/contacts/:id/signals`.

### Jacq's Context Section

DataRows: Role / Introduced by / Last contact topic / Working style / Notes.

Values are Jacq's inferred or stored context — all editable via JBubble. Source shown as "From emails" or "From calendar" for inferred rows (amber treatment if unconfirmed).

### Communication Preferences Section

Per-contact overrides for how to communicate with this specific person.

DataRows:
- Preferred channel (Email / Telegram / WhatsApp / Call)
- Tone (Formal / Friendly / Brief)
- Sign-off override (if different from default)
- Response SLA (e.g. "Within 2 hours for VIPs")
- What to avoid (e.g. "Don't mention the reorg")

All editable via JBubble. `PATCH /api/contacts/:id/preferences`.

### Open Items Section

List of outstanding actions involving this person: tasks where they're listed in `people_involved`, commitments Jacq has made related to them, emails awaiting reply.

Each row: description + type tag + due/age + JBubble.

Add row at bottom: JBubble (add) + "Add open item via Jacq".

---

## 10. Settings

**Route:** `/settings`
**Tab:** Settings

### Layout

```
StatusBar
TopNav (title: "Settings", burger)
─────────────────────────────────────────────
Scrollable content:
  [For each group:]
  SL "Group label"
  Settings card (rows)
─────────────────────────────────────────────
BottomNav (active: settings)
```

### Groups and Rows

#### Integrations

| Key | Value display | Action |
|-----|--------------|--------|
| Gmail | "Connected" (green) / "Not connected" (t3) | Connect / Disconnect |
| Google Calendar | "Connected" (green) / "Not connected" | Connect / Disconnect |
| Google Drive | "Connected" / "Not connected" | Connect / Disconnect |
| Telegram | "Connected" (green) / "Not connected" | Connect / Disconnect |

**Connect flows:**
- Gmail / Calendar / Drive: Re-trigger OAuth with appropriate scopes via Supabase
- Telegram: Show modal with deep link to Telegram bot + 6-digit pairing code (see Section 14)

**Disconnect:** Opens confirmation modal. On confirm: revokes token, removes from `user_integrations`. JBubble on each row for chat-based help.

---

#### AI & Desktop

| Key | Value | Behaviour |
|-----|-------|-----------|
| Cloud LLM | Provider name (Anthropic / OpenAI / Google) | Tap → opens LLM Provider modal |
| Local LLM | Model name + running state | Tap → opens Local LLM modal |
| Desktop app | "Running v0.x.x" (green) / "Not installed" (t3) | Tap → opens download/install guide |
| Browser control | "Enabled" / "Disabled" | Toggle |
| Own API key | "Set" (green) / "Not set" (t3) | Tap → opens API key entry modal |

---

#### Communication Style

| Key | Value | Behaviour |
|-----|-------|-----------|
| Tone | "Direct, warm, no filler" | Tap → JBubble chat to update |
| Response length | "Concise" | Tap → JBubble chat to update |
| Sign-off (as PA) | "Jacq, PA to [Name]" | Tap → JBubble chat to update |
| Sign-off (as user) | "[First name]" | Tap → JBubble chat to update |
| Language | "British English" | Tap → dropdown modal |

All communication style settings stored in `users.preferences.communication`. Changes take effect on next Jacq action.

---

#### Quiet Hours

| Key | Value | Behaviour |
|-----|-------|-----------|
| Start | "08:00" | Tap → time picker modal |
| End | "20:00" | Tap → time picker modal |
| Weekends | "Off (emergencies only)" | Tap → three-option modal: Off / Same as weekday / Emergencies only |

Stored in `users.preferences.quiet_hours`. Jacq will not send proactive Telegram messages outside quiet hours except for items flagged as urgent.

---

#### Performance & Feedback

| Key | Value | Behaviour |
|-----|-------|-----------|
| Weekly review | "Every Friday, 17:00" | Tap → day/time picker modal |
| Learning review | "Every Sunday, 19:00" | Tap → day/time picker modal |
| Pattern learning | "All categories" | Tap → pattern learning modal |
| Feedback channel | "Via Telegram" | Display only |
| Version | "Alpha 0.4.1" | Display only (DM Mono) |

---

#### Privacy & Data

| Key | Value | Behaviour |
|-----|-------|-----------|
| Local-only mode | Toggle (default off) | When on: no data sent to cloud LLMs |
| Data export | — | "Export" gold action → generates JSON download |
| Audit log | — | Arrow → navigates to `/audit-log` |
| Delete all data | — | "Delete" red action → confirmation modal (destructive) |

**Delete all data:** Double-confirmation modal (see Section 14). Cannot be undone. Deletes all user data from Supabase. Revokes all OAuth tokens. User is signed out.

---

## 11. Desktop App

The desktop app is a separate Electron/Tauri application. These screens appear in the web app's wireframe viewer for reference, but the actual UI is rendered by the desktop app itself.

### Menu Bar (Collapsed)

Width: 264px. Dark background (`rgba(18,16,8,0.97)`). Displayed when user clicks the Jacq icon in the macOS/Windows menu bar.

**Content:**
- Header: JAvatar (28px) + JacqLogo (18px, gold) + active/inactive dot
- Local model: model name + "Running" (green) / "Idle" (t3)
- Token split today: progress bar showing local % vs cloud %
- Browser control: toggle
- Current task: what Jacq is actively doing right now (live via IPC from background service)
- Menu items: Open dashboard / Pause Jacq / Model settings / Quit

### Menu Bar (Expanded)

Width: 340px. Extended panel below the collapsed view.

**Content:**
- **Model selector:** Three model rows (each with name, size, status badge — Running/Loaded/Idle). Active model has gold dot. Tap to switch. Switching: `POST /api/desktop/set-model { modelId }` via local IPC.
- **Browser automation:** Enabled/Disabled toggle. Sessions today count. Pages visited today count.
- **Token usage today:** Split bar (local vs cloud). Numeric breakdown below.
- **System resources:** RAM used/total. Storage used/total. CPU activity (sparkline if possible).

### Desktop ↔ Web Communication

The desktop app and web app communicate via a local REST API the desktop app exposes on `localhost:39871`. The web app (when the desktop is running) can:
- `GET /local/status` — model running state, current task
- `POST /local/run-task` — send a task for local LLM processing
- `GET /local/token-usage` — today's split

The desktop app registers itself by calling `POST /api/desktop/register` with the local port on startup.

---

## 12. Burger Nav Overlay

**Trigger:** Burger icon (top-right TopNav) on any post-login screen.

### Layout

Full-screen overlay. Same background as the current screen (`var(--bg)` for light, dark bg for dark mode). Slides in from right (or fades in — decide in build).

```
[X close] top right
JacqLogo (22px) top left
────────────────────────
Nav items (vertical list):
  Understanding
  Tasks
  Activity
  Relationships
  Settings
────────────────────────
Dark / Light toggle row
────────────────────────
"Message Jacq" shortcut button
────────────────────────
Version string (bottom)
```

### Nav Items

Each item: icon (SVG, 20px) + label (Gilda Display 15px) + sub-label (DM Sans 12px `var(--t2)`). Active item: gold text. Tap: close overlay and navigate.

| Item | Sub-label |
|------|----------|
| Understanding | Jacq's picture of you |
| Tasks | Jacq's work surface |
| Activity | Commitments, actions and patterns |
| Relationships | People Jacq knows about |
| Settings | Integrations, LLM, preferences |

### Dark / Light Toggle

Row: moon/sun icon + label (Gilda 14px "Dark mode" / "Light mode") + toggle switch right-aligned. On toggle: updates `users.preferences.dark_mode` and applies CSS custom property change immediately.

### Message Jacq

Gold-tinted pill button full-width. Label: "Message Jacq" white text. On tap: deep link to Telegram bot (`tg://resolve?domain=jacq_bot`). Opens Telegram if installed, falls back to `https://t.me/jacq_bot`.

### Close

X button top-right (32px, `var(--surf2)` background, 10px radius). Or swipe right to dismiss. Or tap outside overlay area.

---

## 13. In-App Chat Panel

**Trigger:** Any JBubble tap anywhere in the app.

### Layout

Slides up from bottom of screen. Height: 72% of screen height. Handle bar at top (40px wide, 4px tall, `var(--bord)` colour, 2px radius, centred). X button top-right.

```
Handle bar
─────────────────────────────────────────────
Context label (DM Mono 11px var(--t3)):
  "Understanding · Communication"
  or "Tasks · Organise team offsite"
  or "Activity · Commitments"
─────────────────────────────────────────────
Message history (flex: 1, scroll)
  JMsg (Gilda Display 20px, no bubble)
  UMsg (surf2 rounded box)
─────────────────────────────────────────────
Input bar:
  Text input (flex 1, DM Sans 14px)
  Send button (gold arrow icon)
```

### State

Panel state managed in Zustand: `isChatPanelOpen`, `activeChatContext`, `chatHistory: Message[]`.

On open: clear previous history. Load `activeChatContext`. Send initial system message to LLM including context.

### Context Injection

When the panel opens, a system message is constructed:

```
You are Jacq. The user is currently viewing: {context.screen} > {context.section}.
{if context.itemId} They tapped on: "{context.itemLabel}". Current value: {fetchedValue}.
{if context.prefill} The user wants to: {context.prefill}.
Respond to help them update, add, or discuss this item.
```

### Message Flow

1. User types and sends
2. Message appended to `chatHistory` as UMsg
3. `POST /api/chat` `{ messages: chatHistory, context: activeChatContext }`
4. Streaming response rendered as JMsg (stream tokens into Gilda Display text block)
5. On completion: parse response for any actions (update understanding entry, create task, etc.)
6. Execute actions optimistically
7. Show "Saved to understanding" / "Task created" / etc. gold panel inline

### Actions Jacq Can Take From Chat

| Intent | Action |
|--------|--------|
| Update understanding entry | `PATCH /api/understanding/:id` |
| Create understanding entry | `POST /api/understanding` |
| Delete understanding entry | `DELETE /api/understanding/:id` |
| Create task | `POST /api/tasks` |
| Update task | `PATCH /api/tasks/:id` |
| Update contact | `PATCH /api/contacts/:id` |
| Create commitment | `POST /api/commitments` |
| Mark commitment done | `PATCH /api/commitments/:id` `{ status: 'completed' }` |
| Update setting | `PATCH /api/users/preferences` |
| Dismiss pattern | `PATCH /api/patterns/:id` `{ status: 'dismissed' }` |
| Confirm pattern | `PATCH /api/patterns/:id` `{ status: 'confirmed' }` + create understanding entry |

### Closing

X button, swipe down, or tap outside panel. Chat history cleared from Zustand. Panel animates down.

### Keyboard Handling

When mobile keyboard opens, panel shifts up to keep input bar above keyboard. `window.visualViewport` resize listener.

---

## 14. Modals and Micro-flows

### Modal: Pause Autonomous Actions

**Trigger:** "Pause all autonomous actions" button on Activity screen.

**Content:** Title "Pause Jacq?" Gilda 20px. Body: "Jacq will stop all autonomous actions immediately. I'll still monitor and alert you, but I won't act without asking first. You can resume any time." DM Sans 14px `var(--t2)`.

**Actions:** "Pause now" (dark filled) + "Cancel" (ghost). On "Pause now": `POST /api/users/pause-autonomy`. Telegram message sent. Button on Activity screen changes to "Resume autonomous actions" (green tint).

---

### Modal: Delete All Data (Double Confirmation)

**Step 1:** Title "Delete everything?" Body: "This will permanently delete all your data — understanding, tasks, activity, relationships, and settings. This cannot be undone." Actions: "Yes, delete my data" (red) + "Cancel".

**Step 2 (after confirming step 1):** Title "Are you absolutely sure?" Input field: "Type DELETE to confirm." "Confirm deletion" button (disabled until correct text entered). On confirm: `DELETE /api/users/me`. User signed out. Redirected to `/signin`.

---

### Modal: Telegram Connect

**Trigger:** "Connect" action on Telegram row in Settings.

**Content:** 
1. "Open Telegram and start a chat with @jacq_bot" — with deep link button
2. "Enter your pairing code" — 6-digit code input (DM Mono, large, centred)
3. Pairing code displayed prominently: fetched from `POST /api/telegram/generate-code`

**Flow:** User opens Telegram, sends `/start` to bot, bot replies with instructions. User enters code in app. `POST /api/telegram/verify-code { code }`. On success: modal closes, row shows "Connected" green. Jacq sends a welcome message via Telegram.

**Code expiry:** 5 minutes. "Regenerate code" link appears after 4 minutes.

---

### Modal: LLM Provider

**Trigger:** Cloud LLM row in Settings.

**Content:** Three provider options (Anthropic / OpenAI / Google) as selectable cards. Each shows: logo, model name (e.g. "Claude 3.5 Sonnet"), cost indication. Selected: `var(--goldl)` background, `var(--goldb)` border.

**Own API key toggle:** If user wants to use their own key (reduces cost), shows input field for API key. Key stored encrypted in `user_integrations`. Toggle label: "Use your own API key".

**Actions:** "Save" + "Cancel".

---

### Modal: Local LLM

**Trigger:** Local LLM row in Settings (desktop app must be running).

**Content:** Three model options as selectable cards (e.g. Llama 3 8B / Phi-3 Mini / Mistral 7B). Each shows: name, size on disk, speed rating, "Downloaded" status.

**Download:** If not downloaded, shows "Download" action (triggers desktop app to fetch the model). Shows progress during download.

**Actions:** "Set as active model" + "Cancel".

---

### Modal: Time Picker (Quiet Hours / Review Schedule)

Simple hour:minute picker. Scrollable columns. Saves on "Done".

---

### Modal: Pattern Learning Preferences

**Trigger:** "Pattern learning" row in Settings.

**Content:** Toggle list of pattern categories:
- Calendar patterns (rescheduled meetings, meeting length)
- Email patterns (response time, VIP detection)
- Communication patterns (tone, channel preferences)
- Lifestyle patterns (lunch, gym, personal calendar)

Each toggle: on = Jacq will surface observations for this category. Off = Jacq will still learn but won't surface suggestions.

**Actions:** "Save" + "Cancel".

---

### Modal: Commitment Detail

**Trigger:** Tapping a commitment card on the Activity screen (alternative to JBubble).

**Content:** Full commitment record. Title, source (with "View original conversation" link if from Telegram), created date, due date, current status, and any notes from Jacq about progress.

**Actions:**
- "Mark as done" → `PATCH /api/commitments/:id` `{ status: 'completed' }`
- "Snooze" → date picker, extends due date
- "Cancel commitment" → `PATCH /api/commitments/:id` `{ status: 'cancelled' }` — Jacq sends Telegram message
- "Discuss with Jacq" → opens chat panel with commitment as context

---

### Micro-flow: Confirm Inferred Entry

1. User taps "Confirm?" on amber-bordered DataRow in Understanding
2. Optimistic UI: row immediately transitions to full-confidence styling (amber border removed, value darkens to `var(--t1)`)
3. `PATCH /api/understanding/:id` `{ source: 'confirmed' }` in background
4. If request fails: rollback UI, show brief error toast

---

### Micro-flow: Approve Action From Activity

When Jacq has an action awaiting approval (previously shown in Activity, now surfaced via Telegram):

1. Telegram message arrives: "Ready to send this reply to Ben? [view draft]"
2. "view draft" is a deep link: `jacq://activity/pending/:actionId`
3. Opens app to Activity screen, scrolls to the pending action
4. User can approve directly via Telegram reply ("Yes") or tap JBubble to discuss
5. On approval: `POST /api/activity-log/:id/approve` — Jacq executes the action
6. Action moves to "Done today" log

---

### Micro-flow: Weekly Learning Review

**Trigger:** Jacq sends Telegram message on Sunday evening. User can also trigger from the Understanding screen learning card.

1. `GET /api/learning-reviews/pending` — returns this week's inferred entries
2. Jacq opens the Telegram conversation: "This week I picked up a few things. Let me run through them."
3. For each entry: "I noticed you always [observation]. Does that sound right? Should I [proposed action]?"
4. User replies: Yes / No / Do it differently
5. "Yes" → `PATCH /api/understanding/:id` `{ source: 'confirmed' }` + creates autonomy rule if relevant
6. "No" → `PATCH /api/understanding/:id` `{ source: 'dismissed' }` — entry deleted
7. "Differently" → follow-up question to refine
8. After all entries reviewed: "That's everything. I'll keep learning — same time next week."
9. `PATCH /api/learning-reviews/:id` `{ status: 'completed' }`
10. Understanding screen learning card disappears

---

## 15. Data Models

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'
    -- preferences shape:
    -- {
    --   dark_mode: boolean,
    --   autonomy_level: 'cautious' | 'balanced' | 'autonomous',
    --   autonomy_paused: boolean,
    --   quiet_hours: { start: '08:00', end: '20:00', weekends: 'off' | 'same' | 'emergencies' },
    --   communication: {
    --     tone: string,
    --     response_length: string,
    --     signoff_pa: string,
    --     signoff_user: string,
    --     language: string
    --   },
    --   weekly_review: { day: number, time: string },
    --   learning_review: { day: number, time: string },
    --   pattern_categories: string[]
    -- }
);
```

---

### understanding_entries

```sql
CREATE TABLE understanding_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,          -- 'about_me' | 'communication' | 'calendar_time' | 'working_style'
  label TEXT NOT NULL,            -- e.g. 'Morning person'
  value TEXT NOT NULL,            -- e.g. 'Most productive 8–11am'
  source TEXT NOT NULL,           -- 'told' | 'inferred' | 'confirmed' | 'dismissed'
  confidence FLOAT DEFAULT 1.0,   -- 0–1, used for inferred entries
  evidence JSONB,                 -- what observations support this inference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### commitments

```sql
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  source_type TEXT,               -- 'telegram' | 'task' | 'email' | 'chat'
  source_ref TEXT,                -- reference to original message/task/email id
  source_label TEXT,              -- human-readable: "From Telegram, 10 Mar 09:14"
  task_id UUID REFERENCES tasks(id),
  completed_at TIMESTAMPTZ,
  missed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo',     -- 'todo' | 'jacq_acting' | 'waiting' | 'done'
  tags TEXT[],
  working_note TEXT,              -- Jacq's current working note
  source TEXT,                    -- "From: Sarah's email", "From: Telegram", "Added manually"
  source_ref TEXT,                -- email ID, telegram message ID, etc.
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  owner TEXT DEFAULT 'jacq',      -- 'jacq' | 'user'
  done BOOLEAN DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0
);

CREATE TABLE task_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  role TEXT                       -- 'requester' | 'approver' | 'participant'
);
```

---

### activity_log

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL,      -- 'email' | 'calendar' | 'task' | 'research' | 'message'
  autonomy TEXT NOT NULL,         -- 'full' | 'supervised' | 'suggested'
  status TEXT DEFAULT 'done',     -- 'done' | 'pending_approval' | 'undone'
  is_undoable BOOLEAN DEFAULT FALSE,
  undone_at TIMESTAMPTZ,
  payload JSONB,                  -- full action detail for undo
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### patterns

```sql
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  observation TEXT NOT NULL,      -- human-readable: "You reschedule Friday afternoons..."
  category TEXT NOT NULL,         -- 'calendar' | 'email' | 'communication' | 'lifestyle'
  proposed_action TEXT,           -- what Jacq would do if confirmed
  evidence JSONB,                 -- supporting data points
  status TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'dismissed'
  confirmed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### contacts

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  organisation TEXT,
  email TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  initials TEXT,
  colour TEXT,                    -- hex for avatar background
  jacq_context JSONB,             -- { introduced_by, last_contact_topic, working_style, notes }
  communication_preferences JSONB,-- { channel, tone, signoff, sla, avoid }
  response_rate TEXT,             -- 'fast' | 'normal' | 'slow' — computed
  meeting_frequency TEXT,         -- 'weekly' | 'monthly' | 'occasional' | 'rare' — computed
  last_contact_at TIMESTAMPTZ,    -- computed from max(last email, last meeting)
  alert TEXT,                     -- birthday/occasion string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  item_type TEXT,                 -- 'task' | 'commitment' | 'email_awaiting_reply'
  ref_id UUID,                    -- pointer to tasks or commitments or activity_log
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### weekly_learning_reviews

```sql
CREATE TABLE weekly_learning_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'in_progress' | 'completed'
  scheduled_for TIMESTAMPTZ,
  entries_to_review UUID[],       -- understanding_entry ids with source='inferred'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### user_integrations

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,         -- 'gmail' | 'calendar' | 'drive' | 'telegram'
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  telegram_chat_id TEXT,          -- for telegram integration
  connected_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'    -- 'active' | 'expired' | 'revoked'
);
```

---

## 16. API Reference

### Understanding

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/understanding` | All entries grouped by section |
| GET | `/api/understanding?source=inferred` | Filter to inferred entries only |
| POST | `/api/understanding` | Create new entry |
| PATCH | `/api/understanding/:id` | Update entry (value, source, label) |
| DELETE | `/api/understanding/:id` | Delete entry |

---

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | All tasks, all statuses |
| GET | `/api/tasks?status=todo` | Filter by status |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task (status, working_note, etc.) |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/:id/subtasks` | Subtasks for task |
| POST | `/api/tasks/:id/subtasks` | Add subtask |
| PATCH | `/api/tasks/:id/subtasks/:subId` | Update subtask (done, text, owner) |
| DELETE | `/api/tasks/:id/subtasks/:subId` | Delete subtask |
| GET | `/api/tasks/:id/people` | People involved |
| POST | `/api/tasks/:id/people` | Add person |
| DELETE | `/api/tasks/:id/people/:contactId` | Remove person |

---

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commitments` | All commitments (query: status, period) |
| POST | `/api/commitments` | Create commitment |
| PATCH | `/api/commitments/:id` | Update commitment |
| GET | `/api/activity-log` | Action log (query: period=today/yesterday/week) |
| POST | `/api/activity-log/:id/approve` | Approve pending action |
| POST | `/api/activity-log/:id/undo` | Undo action (within 30 min window) |
| GET | `/api/patterns` | Patterns (query: status=pending) |
| PATCH | `/api/patterns/:id` | Update pattern status |

---

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | All contacts |
| POST | `/api/contacts` | Create contact |
| GET | `/api/contacts/:id` | Single contact |
| PATCH | `/api/contacts/:id` | Update contact |
| PATCH | `/api/contacts/:id/preferences` | Update communication prefs |
| GET | `/api/contacts/:id/signals` | Computed relationship signals |
| GET | `/api/contacts/:id/open-items` | Open items for contact |
| POST | `/api/contacts/:id/open-items` | Add open item |
| DELETE | `/api/contacts/:id/open-items/:itemId` | Remove open item |

---

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to Jacq, returns streaming response |
| GET | `/api/chat/history` | Recent chat history (for context) |

---

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Current user and preferences |
| PATCH | `/api/users/preferences` | Update preferences |
| POST | `/api/users/pause-autonomy` | Pause autonomous actions |
| POST | `/api/users/resume-autonomy` | Resume autonomous actions |
| DELETE | `/api/users/me` | Delete account and all data |

---

### Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations` | All integration statuses |
| POST | `/api/integrations/telegram/generate-code` | Generate pairing code |
| POST | `/api/integrations/telegram/verify-code` | Verify pairing code |
| DELETE | `/api/integrations/:provider` | Disconnect integration |

---

### Learning Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/learning-reviews/pending` | Current pending review |
| PATCH | `/api/learning-reviews/:id` | Update review status |

---

## 17. Navigation and Routing

### Route Map

```
/signin                     → Sign In
/onboarding/welcome         → Cutscene
/onboarding/conversation    → Intro Conversation
/onboarding/connect         → Connect Google

/understanding              → Understanding (root)
/tasks                      → Tasks Kanban (root)
/tasks/:id                  → Task Detail (push)
/activity                   → Activity (root)
/relationships              → Relationships (push from burger)
/relationships/:id          → Relationship Detail (push)
/settings                   → Settings (root)
/audit-log                  → Audit Log (push from Settings)
```

### Navigation Patterns

| From | To | Method |
|------|----|--------|
| Bottom tab tap | Tab root screen | Replace (no back stack) |
| Burger nav tap | Any screen | Replace (close burger first) |
| Task card tap | Task Detail | Push (back button shows) |
| Relationship card tap | Relationship Detail | Push |
| Settings row tap | Modal | Modal overlay |
| JBubble tap | Chat panel | Bottom sheet overlay (no route change) |
| Burger tap | Burger overlay | Full-screen overlay (no route change) |

### Deep Links

Format: `jacq://[route]`

| Deep link | Navigates to |
|-----------|-------------|
| `jacq://activity/pending/:id` | Activity screen, scrolled to pending action |
| `jacq://tasks/:id` | Task Detail |
| `jacq://understanding` | Understanding screen |
| `jacq://relationships/:id` | Relationship Detail |

---

## 18. Empty States

### Understanding — New User

"Nothing here yet — I'll fill this in as I get to know you." shown within each empty section card. No richness indicator. No search bar. "Teach Jacq something new" CTA still visible.

### Understanding — No Search Results

"No entries matching '[query]'." Below search bar. No content below.

### Tasks — No Tasks

Hero empty state: Jacq avatar icon, Gilda Display 18px "No tasks yet.", DM Sans 13px body: "I'll extract action items from your emails automatically, or you can add one now." + "Add task via Jacq" button (opens chat).

### Tasks — Empty Column

Show only the dashed add card. No section label. Column chip shows count of 0.

### Activity — No Commitments

In Commitments section: "No active commitments. When I commit to doing something, it'll appear here." — DM Sans 13px `var(--t2)`.

### Activity — No Actions Today

"Nothing yet today — I'll log actions here as I work." — DM Sans 13px `var(--t2)`.

### Activity — No Patterns

"I'll surface patterns here as I get to know how you work. Usually takes a week or two." — DM Sans 13px `var(--t2)`.

### Relationships — No Contacts

"No contacts yet. I'll build this from your email and calendar as I connect them." — DM Sans 13px `var(--t2)`. + "Add contact via Jacq" button.

### Relationships — No Search Results

"No contacts matching '[query]'."

---

## 19. Error States

### Network Error (Generic)

Small toast at bottom of screen. Red background `var(--redl)`, red border. "Couldn't connect. Check your connection and try again." DM Sans 12px. Auto-dismisses after 4 seconds. Retry button.

### API Error on Mutation

Toast: "Couldn't save that change. Please try again." Optimistic updates rolled back.

### Chat Panel — LLM Error

Inline error message in chat: "Something went wrong. Tap to retry." in `var(--t2)`. Tap to resend last message.

### Integration Disconnected

If Gmail or Calendar token is expired when the user opens a dependent screen: banner below TopNav: "Your Gmail connection needs refreshing." + "Reconnect" link (triggers OAuth re-auth).

### Understanding Entry Conflict

If user edits an entry that was also updated by Jacq (via Telegram) in the last 30 seconds: "Jacq just updated this entry too. Which version would you like to keep?" — shows both values, user picks.

### Session Expired

If Supabase session expires mid-use: full-screen overlay: "Your session expired. Sign back in to continue." Sign in button. Preserves current route — user returns to same screen after auth.

---

*End of Functional Specification*
