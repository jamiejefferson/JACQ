# JACQ — Build Methodology

**Version:** 1.0  
**Date:** 9 March 2026  

---

## Core Principle: Vertical Slices

**Don't build horizontal layers** (all backend → all frontend → all integrations).  
**Build vertical slices** — thin, complete features end-to-end. Each slice is deployable and testable.

```
❌ Horizontal (bad):
   [All DB tables] → [All API endpoints] → [All UI screens]

✅ Vertical (good):
   [Chat: DB + API + UI] → [Calendar: DB + API + UI] → [Email: DB + API + UI]
```

---

## Step 0: Walking Skeleton (3-5 days)

Before anything else, prove the core loop works.

### Goal

```
[ Expo app ] → [ Supabase Edge Function ] → [ Claude API ] → [ Response on screen ]
```

### Tasks

| Task | Time | Output |
|------|------|--------|
| `npx create-expo-app jacq` | 30 min | Expo project |
| Create Supabase project | 15 min | Project URL + keys |
| Create `/chat` Edge Function | 2 hrs | Function that calls Claude |
| Basic chat UI | 2 hrs | Text input + message display |
| Wire app → API | 1 hr | End-to-end working |

### Deliverable

A single screen where you type a message, it hits your backend, calls Claude, returns a response. **Ugly is fine.** This unblocks everything.

### Validation

- [ ] Can type message and see response
- [ ] Response comes from Claude (not hardcoded)
- [ ] Works on iOS simulator
- [ ] Works on Android emulator

---

## Step 1: Chat MVP (1 week)

Build the minimum chat that persists.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| Create `profiles` table | DB | 30 min |
| Create `conversations` table | DB | 30 min |
| Create `messages` table | DB | 30 min |
| Google OAuth setup | Auth | 2 hrs |
| Sign-in screen | UI | 2 hrs |
| Persist messages to DB | API | 2 hrs |
| Load conversation history | API + UI | 2 hrs |
| Conversation list screen | UI | 2 hrs |

### Deliverable

Sign in with Google, chat with JACQ, close app, reopen, see history.

### Validation

- [ ] Google sign-in works
- [ ] Messages persist across app restarts
- [ ] Can start new conversation
- [ ] Can view past conversations

---

## Step 2: Calendar Integration (1 week)

Add the first real capability.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| Add Calendar scopes to OAuth | Auth | 1 hr |
| Create `integrations` table | DB | 30 min |
| Store Google tokens | API | 2 hrs |
| `calendar.list` tool | API | 3 hrs |
| Tool-use framework (basic) | API | 4 hrs |
| Display events in chat | UI | 2 hrs |

### Deliverable

"What's on my calendar today?" returns real data from Google Calendar.

### Validation

- [ ] OAuth requests Calendar permission
- [ ] "What's on today?" returns real events
- [ ] Events display nicely in chat
- [ ] Works for different date queries

---

## Step 3: Email Integration (1 week)

Same pattern as calendar.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| Add Gmail scopes to OAuth | Auth | 1 hr |
| `email.search` tool | API | 3 hrs |
| `email.read` tool | API | 2 hrs |
| `email.summarise` tool | API | 2 hrs |
| Display emails in chat | UI | 2 hrs |

### Deliverable

"Summarise my unread emails" works with real Gmail data.

### Validation

- [ ] Can search emails by query
- [ ] Can read specific email
- [ ] Summaries are accurate and useful
- [ ] Handles empty inbox gracefully

---

## Step 4: Write Actions (1 week)

Now JACQ can *do* things.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| `email.draft` tool | API | 2 hrs |
| Confirmation flow UI | UI | 3 hrs |
| `email.send` tool | API | 2 hrs |
| `calendar.create` tool | API | 3 hrs |
| `calendar.update` tool | API | 2 hrs |
| Action confirmation UI | UI | 2 hrs |

### Deliverable

"Email Sarah to reschedule to Thursday" → draft → confirm → sent.

### Validation

- [ ] Drafts shown for review before sending
- [ ] User can edit draft before sending
- [ ] User can cancel without sending
- [ ] Calendar events actually created in Google

---

## Step 5: Memory System (1 week)

Make JACQ remember.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| Create `memories` table with pgvector | DB | 1 hr |
| Embedding generation (OpenAI) | API | 2 hrs |
| `memory.store` tool | API | 2 hrs |
| `memory.search` tool (semantic) | API | 3 hrs |
| Auto-extract facts from conversations | API | 4 hrs |
| Inject relevant memories into prompts | API | 3 hrs |

### Deliverable

"What was that restaurant I mentioned?" returns the correct answer.

### Validation

- [ ] Can explicitly store memories
- [ ] Can search memories semantically
- [ ] Relevant memories auto-injected
- [ ] Old conversations inform new ones

---

## Step 6: Proactive — Morning Briefing (1 week)

First proactive feature.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| Create `proactive_jobs` table | DB | 30 min |
| Set up pg_cron for scheduled jobs | DB | 1 hr |
| Morning briefing generator | API | 4 hrs |
| Push notification setup (Expo) | App | 3 hrs |
| Briefing notification | API + App | 2 hrs |
| "Today" view in app | UI | 4 hrs |

### Deliverable

7:30am notification with day overview; tap to see full briefing.

### Validation

- [ ] Notification arrives at configured time
- [ ] Briefing includes calendar, emails, weather
- [ ] Tap opens full briefing in app
- [ ] Can configure briefing time

---

## Step 7: Autonomy Foundation (1-2 weeks)

The trust framework.

### Tasks

| Task | Layer | Time |
|------|-------|------|
| Create `autonomy_actions` table | DB | 30 min |
| Create `trust_config` table | DB | 30 min |
| Create `commitments` table | DB | 30 min |
| Trust level checking | API | 3 hrs |
| Pending actions queue | API | 2 hrs |
| Approval UI (swipe to approve/reject) | UI | 4 hrs |
| Execution engine | API | 3 hrs |
| Undo functionality | API + UI | 3 hrs |
| Audit log | API | 2 hrs |
| Commitment checker (background) | API | 3 hrs |

### Deliverable

JACQ proposes sending a follow-up email → you approve → it sends.

### Validation

- [ ] Actions require approval based on trust level
- [ ] Approvals execute correctly
- [ ] Rejections logged with feedback
- [ ] Undo works within time window
- [ ] Commitments tracked and followed up

---

## The Pattern

Every slice follows:

```
1. Define the user story ("I want to...")
2. Design the minimal schema (if new tables needed)
3. Build the minimal API (Edge Function)
4. Build the minimal UI (one screen/component)
5. Wire them together
6. Test end-to-end (happy path + edge cases)
7. Polish only if necessary
8. Ship to TestFlight / internal testing
9. Get feedback
10. Iterate or move on
```

---

## Tooling Setup (Do Once)

Before starting Step 0:

| Tool | Purpose | Setup Time |
|------|---------|------------|
| Expo + EAS | React Native builds | 1 hr |
| Supabase project | Backend | 15 min |
| GitHub repo | Version control | 15 min |
| TestFlight | iOS distribution | 30 min |
| Linear / GitHub Issues | Task tracking | 15 min |
| VS Code + extensions | Development | 30 min |

### Recommended VS Code Extensions

- ESLint
- Prettier
- Expo Tools
- Supabase (unofficial)
- GitHub Copilot (optional)

### Environment Setup

```bash
# Install Expo CLI
npm install -g expo-cli eas-cli

# Create project
npx create-expo-app jacq
cd jacq

# Install key dependencies
npx expo install @supabase/supabase-js
npx expo install expo-secure-store
npx expo install expo-notifications
npx expo install expo-auth-session expo-web-browser
```

---

## What NOT to Do

| Don't | Why | Do Instead |
|-------|-----|------------|
| Build full DB schema upfront | Requirements change | Add tables as needed |
| Perfect the UI before features work | Premature optimisation | Get function working, then polish |
| Build multi-provider LLM support early | Complexity | Single provider until stable |
| Build offline mode first | Edge case | Online first, offline later |
| Optimise before users exist | No data | Ship, measure, then optimise |
| Write tests for everything | Slows early iteration | Test critical paths only |
| Build admin dashboard | Not user-facing | Use Supabase dashboard |

---

## Visual Roadmap

```
Week 1     [========== Walking Skeleton + Chat MVP ==========]
Week 2     [========== Calendar Integration ==========]
Week 3     [========== Email Integration ==========]
Week 4     [========== Write Actions + Confirmations ==========]
Week 5     [========== Memory System ==========]
Week 6     [========== Morning Briefing ==========]
Week 7-8   [========== Autonomy Framework ==========]
Week 9+    [========== Polish, Local LLM, More Proactive ==========]
```

---

## Definition of Done (Per Slice)

- [ ] Feature works end-to-end
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] No console errors
- [ ] Handles loading states
- [ ] Handles error states
- [ ] Shipped to TestFlight
- [ ] Documented in this repo (if complex)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Google API rate limits | Implement caching, request batching |
| Expo limitations | Identify native module needs early, eject if required |
| Supabase Edge Function limits | Monitor usage, prepare migration path |
| LLM costs spiral | Implement local routing early, set hard budget caps |
| Scope creep | Strict slice definitions, defer "nice to haves" |

---

## Feedback Loops

### Daily

- Run through latest build
- Note friction points
- Fix blockers immediately

### Weekly

- Demo to yourself (or a friend)
- Review what's working, what's not
- Adjust next week's focus

### Per-Slice

- Ship to TestFlight
- Use it yourself for a day
- Identify top 3 improvements
- Decide: fix now or defer?

---

## When to Move On

A slice is "done enough" when:

1. The happy path works reliably
2. Major error cases handled
3. UX is usable (not necessarily beautiful)
4. You've used it yourself for real tasks

Don't gold-plate. Ship, learn, iterate.

---

*Build methodology for JACQ. Vertical slices, rapid iteration, ship early.*
