# Not Yet Covered — Test Gap List

**Updated:** 2026-03-12 for current product (Home at /app, Connect Google, delete account, bezel, menu in viewer).

Items from [TEST-CHECKLIST.md](TEST-CHECKLIST.md) that have not been fully verified. Use this list to tick off as you add tests or manual verification. See [FULL-TEST-AND-FIX.md](FULL-TEST-AND-FIX.md) for process.

---

## §1 Global Architecture

- [x] **Unauthenticated redirect:** Visiting `/` as unauthenticated user redirects to sign-in (middleware; incognito confirms E2E).
- [x] **Visual:** Shell 375px max-width; main content scrollable (layout max-w-[375px], data-app-scroll overflow-y-auto).
- [x] **Visual:** Light mode page background cream (`#f5f2ec` / `var(--jacq-bg)`), not solid black (globals.css + body).
- [x] Post-login app routes protected; unauthenticated access redirects to sign-in (middleware).

---

## §2 Design System

- [x] **Visual:** Design tokens applied (body background, surface cards, borders, text colours, light theme) — verified in globals.css and components.
- [x] **Visual:** Dark mode toggle updates background and surfaces; `[data-theme="dark"]` tokens apply (ThemeSync + burger toggle).
- [ ] JacqLogo appears where specified (sign-in, onboarding, burger overlay).
- [ ] SectionLabel as section headers on Understanding and other screens.
- [ ] DataRow: label/value, optional Confirm/JBubble present; inferred state (amber border, Confirm?).
- [ ] JBubble on rows and section footers; tap opens chat with correct context.
- [ ] TopNav: title, optional sub, back when applicable, action (e.g. "+ Add"), burger.
- [ ] Tag component where used (task tags, relationship badges).
- [ ] Hr (divider) between rows within section cards.

---

## §3 Onboarding

- [ ] **Sign-in visual:** Sign-in page uses `var(--bg)` (cream); no status bar time.
- [ ] JacqLogo and tagline on sign-in; "Continue with Google" visible and clickable.
- [ ] OAuth: clicking button starts redirect; on failure, inline error shown.
- [ ] **Welcome:** Cutscene content visible; Skip intro and CTA navigate to next step.
- [ ] **LLM step:** Validate key (POST /api/llm/validate-key); Card 3 "I've installed it" local check; Continue disabled until valid; Continue saves and goes to conversation.
- [x] **Conversation:** Send message → streamed LLM reply; "Saved to understanding" on extract_understanding; "Done for now" → partial + connect; completion CTA "Connect my accounts →" (verified with LLM configured).
- [ ] **Connect:** Connect Google triggers OAuth; success → /app and onboarding complete; "Skip for now" redirects to app.
- [ ] **Auth callback:** /auth/callback exchanges code; redirect to `next` or default.

---

## §4 Understanding

- [ ] **Visual:** Background and section cards use design tokens; no solid black.
- [ ] TopNav "Understanding" and sub "Jacq's picture of you".
- [ ] Weekly learning review card when pending; "Review" opens chat with context.
- [x] When ≥5 entries: richness indicator ("Jacq understands N things…"); inferred filter; search bar and filtering (min 2 chars).
- [ ] Sections order: About me, Communication, Calendar & time, Working style.
- [ ] Section cards: DataRows, footer JBubble + "Add to [section] via Jacq".
- [x] Inferred entries: amber border, "Confirm?"; tap Confirm → PATCH, row updates (DataRow onConfirm → confirmMutation).
- [ ] JBubble on row opens chat with entry context (screen, section, itemId, itemLabel).
- [ ] Empty state copy per section when <5 entries.

---

## §5 Tasks

- [ ] TopNav "Tasks", sub, "+ Add", burger.
- [ ] "+ Add" opens chat with tasks prefill.
- [ ] **Visual:** Column chips and card styling use design tokens.
- [ ] Tasks load from API; columns reflect status.
- [ ] Empty state: "No tasks yet…", "Add task via Jacq".
- [x] Task card tap → Task detail (/app/tasks/[id]) (with data).
- [ ] JBubble on card opens Task detail and chat with task context.
- [ ] Section footer "Add task via Jacq" opens chat.

---

## §6 Task Detail

- [x] TopNav task title, back to /app/tasks, burger (code verified).
- [x] Status strip (column, source, dates).
- [x] Jacq's working notes panel when present (gold).
- [x] Sub-tasks: list, checkbox, text, owner tag, JBubble; add sub-task footer.
- [x] People involved: avatar, name, role, JBubble; avatar → Relationship detail.
- [x] "Add person via Jacq" footer.

---

## §7 Activity

- [ ] **Visual:** Sections and cards use design tokens.
- [ ] TopNav "Activity", sub, burger.
- [ ] Commitments section (completion rate, cards, completed collapsible when applicable).
- [ ] JBubble on commitment card opens chat.
- [ ] Actions today: log entries, type tag, timestamp; JBubble.
- [ ] Patterns section and cards; JBubble.
- [ ] Autonomy selector: Cautious / Balanced / Autonomous; selection persisted (PATCH).
- [x] "Pause all autonomous actions" → confirmation modal; "Pause now" calls API; button → "Resume" (Activity page).
- [ ] Empty states: "No active commitments…", "Nothing yet today…", "I'll surface patterns…".

---

## §8 Relationships

- [ ] **Visual:** List and cards use design tokens.
- [ ] TopNav "Relationships", sub, burger.
- [x] Search bar filters contacts (name, role, organisation, min 2 chars).
- [x] VIPs and Others sections when data exists.
- [x] Contact card tap → /app/relationships/[id].
- [ ] JBubble on contact opens chat with context.
- [ ] "Add relationship via Jacq" opens chat.
- [ ] Empty state when no contacts; "Add contact via Jacq".
- [x] No search results: "No contacts matching '[query]'."

---

## §9 Relationship Detail

- [x] TopNav contact name, sub (role), back, burger (code verified).
- [x] Header card: avatar, name, role, tags (VIP, alert, open items).
- [ ] Relationship signals strip when implemented.
- [x] "Jacq's context" DataRows; JBubble on row.
- [x] "Communication preferences" DataRows; editable via JBubble.
- [x] "Open items" section and "Add open item via Jacq".

---

## §10 Settings

- [ ] **Visual:** Rows and modals use design tokens.
- [ ] TopNav "Settings", burger.
- [ ] Integrations: Gmail, Calendar, Drive, Telegram; Connect/Disconnect or status.
- [ ] Other groups (AI & Desktop, Communication, Quiet Hours, Performance, Privacy) visible and tappable.
- [x] Delete all data: "Delete" → modal step 1 → step 2 "Type DELETE" → confirm triggers delete and sign-out (Settings page).
- [ ] Log out signs user out and redirects to sign-in.

---

## §12 Burger Nav

- [ ] Burger opens overlay (full-width).
- [x] **Visual:** Overlay uses `var(--bg)` (light or dark), not solid black (inner panel bg-jacq-bg).
- [ ] Nav items: Understanding, Tasks, Activity, Relationships, Settings — label + sub; tap navigates and closes overlay.
- [ ] Dark/Light toggle; toggling updates theme and persists (PATCH preferences).
- [ ] "Message Jacq" link to Telegram.
- [ ] Close: X or tap outside closes overlay.
- [ ] Version string (e.g. "JACQ ALPHA 0.4.1") at bottom.

---

## §13 In-App Chat Panel

- [ ] JBubble (Understanding, Tasks, etc.) opens panel with correct context.
- [ ] **Visual:** Panel slides up; handle bar; context label; message area; input and Send.
- [ ] Context label reflects screen/section/item.
- [x] Send → POST /api/chat; response streams (NDJSON); reply or error (with LLM configured).
- [x] extract_understanding tool result → "Saved to understanding" gold panel inline.
- [x] sessionId sent when resuming; done event returns sessionId.
- [ ] Close (X or backdrop) closes panel and clears history.
- [ ] Input and Send (or Enter) submit.

---

## §14 Modals

- [x] **Pause modal:** From Activity "Pause all autonomous actions"; title/body; "Pause now" and "Cancel"; "Pause now" calls API.
- [x] **Delete modal:** Step 1 warning → Step 2 "Type DELETE"; confirm disabled until "DELETE"; confirm → delete API and sign-out.
- [x] **Confirm inferred:** Understanding "Confirm?" on inferred DataRow → PATCH; row updates (confirmMutation); on failure rollback or toast optional.
- [ ] Optional: Telegram connect, LLM provider, time picker if implemented.

---

## §15 Data Models

- [ ] Schema/migrations exist; key tables present.
- [ ] Key GET endpoints return 200 with valid auth (/api/understanding, /api/tasks, /api/contacts).

---

## §16 API Reference

- [ ] Protected routes return 401 when unauthenticated.
- [ ] Success responses 200/201/204 where applicable with valid session.

---

## §17 Navigation

- [ ] All routes exist and render: sign-in, onboarding (welcome, llm, conversation, connect, connect/complete), app, tasks, tasks/[id], activity, relationships, relationships/[id], settings.
- [ ] Burger nav items navigate correctly and overlay closes.
- [ ] In-app links: task card → task detail; contact card → relationship detail.
- [ ] Back on detail screens returns to list.

---

## §18 Empty States

- [ ] Understanding: per-section empty copy.
- [ ] Tasks: "No tasks yet…", "Add task via Jacq".
- [ ] Activity: "No active commitments…", "Nothing yet today…", "I'll surface patterns…".
- [ ] Relationships: "No contacts yet…", "Add contact via Jacq".
- [ ] Search no results: Understanding "No entries matching…"; Relationships "No contacts matching…".

---

## §19 Error States

- [ ] Understanding (or other) API failure → error message or inline banner, not infinite loading.
- [ ] Chat panel: on LLM/API error, inline error and retry on tap.
- [ ] Optional: Toast or inline on mutation failure; optimistic rollback.
- [ ] Optional: Session expired overlay; integration disconnected banner.
