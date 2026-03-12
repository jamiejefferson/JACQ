# Test Checklist — Jacq Control Panel

This checklist is derived from [jacq-functional-spec.md](../Spec%20docs/jacq-functional-spec.md) and [jacq-functional-spec-addendum.md](../Spec%20docs/jacq-functional-spec-addendum.md) (v1.1). Use it for a full test and fix: run each applicable item, and for items marked **Visual**, verify by appearance (screenshot or computed styles). See [FULL-TEST-AND-FIX.md](FULL-TEST-AND-FIX.md) for the process.

---

## §1 Global Architecture

- [ ] `npm run build` completes with no errors.
- [ ] Visiting `/` as unauthenticated user redirects to sign-in (e.g. `/sign-in`).
- [ ] After successful sign-in, user is redirected to `/onboarding` if `onboarding_complete` is false, else to `/app` (or `/understanding`).
- [ ] **Visual:** Shell respects 375px max-width; main content area is scrollable.
- [ ] **Visual:** In light mode (default), page background is cream (`#f5f2ec` or `var(--jacq-bg)`), not solid black.
- [ ] Post-login app routes (`/app`, `/app/tasks`, etc.) are protected; unauthenticated access redirects to sign-in.

---

## §2 Design System and Shared Components

- [ ] **Visual:** Design tokens are applied: body background, surface cards, borders, and text colours match the spec (light theme).
- [ ] **Visual:** Toggling dark mode (e.g. via burger) updates background and surfaces without full page reload; `[data-theme="dark"]` tokens apply.
- [ ] JacqLogo appears where specified (e.g. sign-in, onboarding, burger overlay).
- [ ] SectionLabel (SL) appears as section headers on Understanding and other screens.
- [ ] DataRow is used for key-value rows (e.g. Understanding entries); label/value and optional Confirm/JBubble are present.
- [ ] JBubble (speech bubble with J) appears on rows and section footers; tap opens chat panel with correct context.
- [ ] TopNav shows title, optional sub, back button when applicable, optional action (e.g. "+ Add"), and burger icon.
- [ ] Tag component renders where used (e.g. task tags, relationship badges).
- [ ] Hr (divider) appears between rows within section cards where specified.

---

## §3 Onboarding Flow

### Sign-in (`/sign-in`)

- [ ] **Visual:** Sign-in page uses `var(--bg)` (cream in light mode); no status bar time (e.g. "9:41").
- [ ] JacqLogo and tagline (e.g. "Your proactive personal assistant") are visible.
- [ ] "Continue with Google" (or equivalent) button is visible and clickable.
- [ ] Clicking the button starts OAuth (redirect to Google or Supabase OAuth).
- [ ] On OAuth failure, an inline error message is shown (e.g. below the button).

### Onboarding welcome (`/onboarding/welcome`)

- [ ] Cutscene/welcome content is visible (e.g. "I'm Jacq" and follow-up copy).
- [ ] "Skip intro" or equivalent is available and navigates to next step when used.
- [ ] CTA (e.g. "Let's get started") navigates to `/onboarding/llm` (addendum v1.1: LLM step before conversation).

### Onboarding LLM step (`/onboarding/llm`) — addendum v1.1

- [ ] Headline: "Before we talk, let's get your AI sorted." and subcopy visible.
- [ ] Three option cards: Jacq's AI (default), Your own API key, Run locally.
- [ ] Card 2: provider radio + API key input; "Validate" calls POST /api/llm/validate-key; valid/invalid feedback shown.
- [ ] Card 3: "I've installed it" pings local status; "Connected" or "Desktop app not detected" shown.
- [ ] "Continue" disabled until valid selection (card 1 = valid by default; card 2 = validated key; card 3 = desktop detected).
- [ ] Continue saves config (PATCH /api/llm/config) and navigates to `/onboarding/conversation`.

### Onboarding conversation (`/onboarding/conversation`)

- [ ] Strip header shows JacqLogo and a label (e.g. "Getting to know you").
- [ ] Real LLM chat: user can type and send; responses stream from POST /api/onboarding/message (addendum v1.1).
- [ ] On each extract_understanding tool result, "Saved to understanding" inline panel (gold) appears.
- [ ] "Done for now" link sets onboarding_phase = partial and navigates to `/onboarding/connect`.
- [ ] When completion suggested by LLM, CTA "Connect my accounts →" appears and navigates to `/onboarding/connect`.

### Onboarding connect (`/onboarding/connect`)

- [ ] Connect Google (or equivalent) button triggers OAuth with appropriate scopes.
- [ ] On success, user is redirected to `/app` (or `/understanding`) and onboarding is marked complete.
- [ ] "Skip for now" (or equivalent) is available and redirects to app when used.

### Auth callback

- [ ] After OAuth, callback at `/auth/callback` exchanges code for session and sets cookies.
- [ ] Redirect after callback goes to `next` param or default (e.g. `/onboarding` or `/app`).

---

## §4 Understanding Screen

**Route:** `/app` (or `/understanding` if implemented)

- [ ] **Visual:** Background and section cards use design tokens; screen does not show a solid black background.
- [ ] TopNav shows title "Understanding" and sub "Jacq's picture of you"; burger is present.
- [ ] When a weekly learning review is pending, Weekly Learning Card is shown (gold styling); "Review" opens chat with weekly-review context.
- [ ] When there are at least 5 entries, richness indicator is shown (e.g. "Jacq understands N things…"); inferred count is tappable and filters to inferred.
- [ ] "Teach Jacq something new" row is visible; tapping it opens chat panel with context `screen: understanding`, `section: new`, no prefill.
- [ ] When ≥5 entries, search bar is visible; placeholder "Search understanding…"; filtering works with at least 2 characters (client-side).
- [ ] Sections appear in order: About me, Communication, Calendar & time, Working style.
- [ ] Each section has a section card (surface background, border), DataRows, and footer with JBubble (add) + "Add to [section] via Jacq".
- [ ] Tapping section footer JBubble opens chat with that section and prefill.
- [ ] Inferred entries show amber left border and "Confirm?"; tapping Confirm calls PATCH and row updates to confirmed styling (optimistic).
- [ ] JBubble on a row opens chat with that entry as context (screen, section, itemId, itemLabel).
- [ ] Empty state: when &lt;5 entries, each section shows "Nothing here yet — I'll fill this in as I get to know you." (or equivalent).

---

## §5 Tasks — Kanban

**Route:** `/app/tasks`

- [ ] TopNav shows "Tasks", sub "Jacq's work surface", action "+ Add", and burger.
- [ ] Tapping "+ Add" opens chat panel with tasks prefill (e.g. "I want to add a new task.").
- [ ] **Visual:** Column chips (To Do, Jacq Acting, Waiting, Done) and card styling use design tokens.
- [ ] Tasks load from API (`GET /api/tasks` or equivalent); columns reflect status.
- [ ] Empty state when no tasks: message (e.g. "No tasks yet…") and "Add task via Jacq" (opens chat).
- [ ] Tapping a task card navigates to Task Detail (`/app/tasks/[id]`).
- [ ] JBubble on a card opens Task Detail and chat panel with that task as context.
- [ ] "Add task via Jacq" (section footer) opens chat with tasks context.

---

## §6 Task Detail

**Route:** `/app/tasks/[id]`

- [ ] TopNav shows task title, back button (to `/app/tasks`), and burger.
- [ ] Status metadata strip is present (column, source, dates if available).
- [ ] Jacq's working notes panel is present when task has working note (gold styling).
- [ ] "Sub-tasks" section with list; each sub-task has checkbox, text, owner tag if applicable, JBubble.
- [ ] Tapping sub-task checkbox toggles done state (user-owned); JBubble opens chat for Jacq-owned.
- [ ] "Add sub-task via Jacq" footer opens chat with task-detail subtasks context.
- [ ] "People involved" section with avatar, name, role, JBubble; tap avatar navigates to Relationship Detail.
- [ ] "Add person via Jacq" footer opens chat.

---

## §7 Activity Screen

**Route:** `/app/activity`

- [ ] **Visual:** Sections and cards use design tokens (no black background).
- [ ] TopNav shows "Activity", sub "Commitments, actions and patterns", burger.
- [ ] Commitments section: completion rate strip (if data), active commitment cards, "Completed this week" collapsible when applicable.
- [ ] JBubble on a commitment card opens chat with activity/commitments context.
- [ ] Actions taken today: log entries with description, type tag, timestamp; JBubble opens chat.
- [ ] Patterns section: pattern cards with observation text, JBubble.
- [ ] Autonomy level selector: Cautious / Balanced / Autonomous; selection is reflected and persisted (e.g. PATCH preferences).
- [ ] "Pause all autonomous actions" button opens confirmation modal; "Pause now" calls pause API; button changes to "Resume" (or equivalent).
- [ ] Empty states: "No active commitments…", "Nothing yet today…", "I'll surface patterns…" (or equivalent) when sections are empty.

---

## §8 Relationships

**Route:** `/app/relationships`

- [ ] **Visual:** List and cards use design tokens.
- [ ] TopNav shows "Relationships", sub "People Jacq knows about", burger.
- [ ] Search bar filters contacts (name, role, organisation) with min 2 characters.
- [ ] VIPs section (expanded cards) and Others section (compact list) are present when data exists.
- [ ] Contact card tap navigates to `/app/relationships/[id]`.
- [ ] JBubble on contact opens chat with relationships context (itemId, itemLabel).
- [ ] "Add relationship via Jacq" row opens chat with relationships section new.
- [ ] Empty state when no contacts: message and "Add contact via Jacq" (or equivalent).
- [ ] No search results: "No contacts matching '[query]'." (or equivalent).

---

## §9 Relationship Detail

**Route:** `/app/relationships/[id]`

- [ ] TopNav shows contact name, sub (e.g. role), back button, burger.
- [ ] Header card: avatar, name, role, tags (VIP, alert, open items).
- [ ] Relationship signals strip (response rate, meets, last contact) when implemented.
- [ ] "Jacq's context" section with DataRows; JBubble on row opens chat.
- [ ] "Communication preferences" section with DataRows; editable via JBubble.
- [ ] "Open items" section with list; add row "Add open item via Jacq" opens chat.

---

## §10 Settings

**Route:** `/app/settings`

- [ ] **Visual:** Settings rows and modals use design tokens.
- [ ] TopNav shows "Settings", burger.
- [ ] Integrations group: Gmail, Calendar, Drive, Telegram rows with Connect/Disconnect (or Connected/Not connected).
- [ ] Other groups (AI & Desktop, Communication, Quiet Hours, Performance, Privacy) as implemented; rows are visible and tappable where specified.
- [ ] Delete all data: "Delete" (or equivalent) opens modal; step 1 then step 2 with "Type DELETE to confirm"; confirm triggers delete and sign-out.
- [ ] Log out (or equivalent) signs user out and redirects to sign-in.

---

## §11 Desktop App

- [ ] **N/A for web-only.** If desktop integration exists: web can call local API (e.g. status) when desktop is running; otherwise mark N/A.

---

## §12 Burger Nav Overlay

- [ ] Burger icon in TopNav opens overlay (full-screen or full-width overlay).
- [ ] **Visual:** Overlay uses `var(--bg)` (light or dark per theme), not solid black.
- [ ] Nav items: Understanding, Tasks, Activity, Relationships, Settings — each with label and sub-label; tap navigates to that route and closes overlay.
- [ ] Dark/Light toggle row: label and switch; toggling updates theme and persists (e.g. PATCH `/api/users/preferences` with `dark_mode`).
- [ ] "Message Jacq" link goes to Telegram (e.g. `https://t.me/jacq_bot` or deep link).
- [ ] Close: X button or tap outside overlay closes overlay.
- [ ] Version string (e.g. "JACQ ALPHA 0.4.1") is visible at bottom.

---

## §13 In-App Chat Panel

- [ ] Tapping JBubble on Understanding ("Teach Jacq something new", section footer, or row) opens chat panel with correct context.
- [ ] Tapping "+ Add" on Tasks opens chat panel with tasks prefill.
- [ ] **Visual:** Panel slides up from bottom; handle bar at top; context label (e.g. "Understanding · …" or "Tasks · …"); message history area; input and Send button.
- [ ] Context label reflects current screen/section/item.
- [ ] Sending a message triggers POST to /api/chat; response streams (NDJSON: tool_result, content, done) — addendum v1.1.
- [ ] When extract_understanding tool result is received, "Saved to understanding" gold panel appears inline in thread.
- [ ] Session id is sent when resuming; done event returns sessionId for future requests.
- [ ] Close: X button or tap outside (backdrop) closes panel and clears chat history from state.
- [ ] Input accepts text; Send (or Enter) submits.

---

## §14 Modals and Micro-flows

- [ ] **Pause modal:** Triggered from Activity "Pause all autonomous actions"; title and body copy per spec; "Pause now" and "Cancel"; "Pause now" calls pause API.
- [ ] **Delete all data modal:** Step 1 (warning) then Step 2 (type DELETE); "Confirm deletion" disabled until "DELETE" entered; on confirm, delete API called and user signed out.
- [ ] **Confirm inferred entry:** On Understanding, tap "Confirm?" on an inferred DataRow; PATCH is called; row updates to confirmed styling (optimistic); on failure, rollback or toast.
- [ ] Optional: Telegram connect modal, LLM provider modal, time picker — smoke test if implemented.

---

## §15 Data Models

- [ ] Optional: Schema and migrations exist; key tables (users, understanding_entries, tasks, commitments, contacts, etc.) are present.
- [ ] Optional: Key GET endpoints return 200 with valid auth (e.g. `/api/understanding`, `/api/tasks`, `/api/contacts`).

---

## §16 API Reference

- [ ] Optional: Protected routes return 401 when unauthenticated; return 200/201/204 where applicable with valid session.
- [ ] Covered indirectly by screen checks (data loads, mutations succeed).

---

## §17 Navigation and Routing

- [ ] Routes exist and render: `/sign-in`, `/onboarding`, `/onboarding/welcome`, `/onboarding/conversation`, `/onboarding/connect`, `/onboarding/connect/complete`, `/app`, `/app/tasks`, `/app/tasks/[id]`, `/app/activity`, `/app/relationships`, `/app/relationships/[id]`, `/app/settings`.
- [ ] Burger nav items navigate to the correct route and overlay closes.
- [ ] In-app links (e.g. task card → task detail, contact card → relationship detail) navigate correctly.
- [ ] Back button on detail screens (task detail, relationship detail) returns to list.
- [ ] Bottom tab bar: N/A if not implemented (spec mentions it for control panel screens).

---

## §18 Empty States

- [ ] Understanding: Each empty section shows "Nothing here yet — I'll fill this in as I get to know you." (or equivalent).
- [ ] Tasks: When no tasks, hero empty state with message and "Add task via Jacq" (or equivalent).
- [ ] Activity: "No active commitments…", "Nothing yet today…", "I'll surface patterns…" (or equivalent) in respective sections when empty.
- [ ] Relationships: "No contacts yet…" (or equivalent) when no contacts; "Add contact via Jacq" available.
- [ ] Search no results: Understanding shows "No entries matching '[query]'."; Relationships shows "No contacts matching '[query]'." (or equivalent).

---

## §19 Error States

- [ ] When Understanding (or other) API fails (e.g. 401 or network error), screen shows error message or inline banner (e.g. "Couldn't load…") rather than infinite loading.
- [ ] Chat panel: On LLM/API error, inline error message (e.g. "Something went wrong. Tap to retry.") and retry on tap.
- [ ] Optional: Toast or inline error on mutation failure (e.g. "Couldn't save that change."); optimistic updates rolled back.
- [ ] Optional: Session expired overlay and sign-in button if implemented.
- [ ] Optional: Integration disconnected banner with Reconnect if implemented.
