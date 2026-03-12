# Jacq — Positioning & Differentiators

**Version:** 2.0
**Date:** 10 March 2026

---

## The Core Idea

Before the three pillars, there is one foundational idea that everything else flows from.

**Jacq is not a tool you use. It's a colleague who works for you.**

Every other AI assistant — ChatGPT, Claude, Siri, Google Assistant — waits to be summoned. You open an app. You type. You get a response. You are always the initiating party. The relationship is: *tool you use when you remember to*.

Jacq is structurally different. It comes to you. You wake up and there is already a briefing in your Telegram. You didn't ask for it. You didn't open anything. Jacq was already working. When a follow-up goes cold, Jacq flags it. When your calendar is overloaded, Jacq tells you before you notice. When something needs doing, Jacq does it and reports back.

This isn't a feature difference. It's a different kind of relationship.

The Telegram interface is not an implementation detail — it's the proof. Every other AI assistant is pull: you go to it. Jacq is push: it comes to you. The fact that your primary interaction with Jacq happens in Telegram, a place you already are, delivered without you opening anything, is the clearest daily demonstration that this product is different. The channel choice is the proposition made tangible.

### One-liner

> **"Jacq is the PA you've always wanted. It works for you — you don't work it."**

### Elevator Pitch

> "Most AI assistants wait to be asked. Jacq doesn't. It monitors your email and calendar, tracks every commitment it makes on your behalf, and reaches out to you — via Telegram — when something needs your attention. It learns how you work over time and gets better every week. You don't open Jacq. Jacq comes to you. After a month with it, you'll wonder how you ever managed without it."

---

## The Three Differentiating Pillars

The three pillars are the proof points for the core idea. Each one is a dimension of what it means to have a colleague working for you rather than a tool sitting idle.

---

# Pillar 1: Deep Personalisation

## Positioning

### Headline
> **"Learns you. Not just your data."**

### The Story

Most AI assistants treat every user the same. Ask the same question, get the same answer. They have no memory of who you are, how you work, or what you care about. Every conversation starts from zero.

Jacq pays attention. From day one, it's learning — not just what you tell it, but how you behave. Your rhythms. Your patterns. The things you never think to mention but that a good assistant would notice. That you always reschedule Friday afternoons. That "quick chat with Alex" usually runs 45 minutes. That you reply to Sarah within the hour but let supplier emails sit for days.

After a week, Jacq knows your morning routine. After a month, it knows your communication style. After a year, it knows you better than any assistant you've ever had — and unlike a human assistant, it never forgets anything, never leaves, and never has a bad day.

**Jacq doesn't just manage your calendar. It understands your life.**

### Key Messages

| Message | Proof Point |
|---------|-------------|
| "Learns how you work" | Adapts to your schedule patterns, meeting preferences, communication style |
| "Writes as you, not as AI" | Drafts emails that sound like you — your tone, your sign-off, your cadence |
| "Gets better every week" | Weekly learning check-ins that refine preferences based on observed behaviour |
| "Your context, always" | Remembers conversations from months ago and references them correctly |
| "Inferred, not just told" | Learns from patterns it observes, not just things you explicitly configure |

### Tagline Options
- "The more you use Jacq, the more Jacq becomes yours."
- "Finally, an assistant that gets you."
- "The PA that actually learns."

---

## In-App Expression: Personalisation

### The "Understanding" Screen

Memory is not a settings page. It is Jacq's living understanding of who you are — a visible, editable picture of what Jacq knows, distinguished by how it was learned.

**Two types of entries:**
- **Told** — things you said during onboarding or via Telegram (shown with full confidence)
- **Inferred** — things Jacq observed from your behaviour (shown with a lighter treatment and a "confirm?" affordance)

**Richness indicator:** "Jacq understands 34 things about you. 18 were inferred from your patterns." This makes learning visible and encourages engagement.

**"Teach Jacq something new" CTA** — distinct from the per-row JBubble edit affordance. Opens a fresh in-app conversation without a specific context pre-loaded.

### Week-1 Progressive Learning

Onboarding is not a one-time event. Jacq continues getting to know the user across the first week:

```
Day 1: Welcome + Google connection + initial conversation
Day 2: "Tell me about your typical week"
Day 3: "Who are the most important people in your work life?"
Day 4: "What do you hate most about your current workflow?"
Day 5: "How do you like to communicate?"
Day 7: "Here's what I've learned so far — anything I got wrong?"
```

### Ongoing Learning Moments

Jacq surfaces learning moments naturally, not as system notifications:

> "I've noticed you always reschedule Friday afternoon meetings. Want me to auto-block Fridays after 1pm?"

> "You've declined three networking events this month. Should I start auto-declining these?"

> "I drafted that email in your usual style — short, friendly, sign-off 'Cheers'. Want me to adjust?"

### Weekly Learning Review

Every Sunday evening (or user-configured):

> "This week I picked up three things about how you work. Want to review them before Monday?"

The review is a short conversational check-in via Telegram. Anything confirmed gets promoted from inferred to confirmed in the Understanding screen. Anything corrected updates immediately.

---

# Pillar 2: Commitment Engine

## Positioning

### Headline
> **"Jacq never drops the ball."**

### The Story

Here is the dirty secret about AI assistants: they forget everything.

Ask ChatGPT to follow up on an email in three days — it won't. Ask it about something it said last week — it has no idea. The conversation ends and it's gone. Every session starts over.

Jacq is different.

When Jacq says "I'll send you a shortlist by end of day," that's a commitment — and it gets logged, tracked, and followed through. Not because you reminded it. Because that's what a PA does.

Every promise Jacq makes is visible. You can see what it's working on, what's pending, and what it has completed. Nothing disappears. Nothing slips. If something can't be done on time, Jacq tells you before the deadline, not after.

**A PA that forgets isn't a PA at all.**

### Key Messages

| Message | Proof Point |
|---------|-------------|
| "Every commitment tracked" | Visible commitment log with due dates and source context |
| "Nothing falls through the cracks" | Automated follow-up on stale items |
| "Transparent" | See exactly what Jacq remembers, edit anything at any time |
| "Accountable" | Weekly digest: here's what I did, here's what's pending, here's your completion rate |

### Tagline Options
- "The AI that actually follows through."
- "Promises made. Promises kept."
- "AI that delivers."

---

## In-App Expression: Commitment Engine

### Commitments Screen

A dedicated view of everything Jacq has committed to doing on the user's behalf:

**Active commitments** — with source context ("created from Telegram conversation, 10 Mar"), due date, and current status.

**Completed this week** — what Jacq actually did, timestamped.

**Missed** — if Jacq couldn't fulfil a commitment, it's visible here with an explanation. Honesty about failure is part of the trust model.

**Completion rate** — a single percentage showing Jacq's track record this week. This is accountability made visible.

### Telegram Expressions

Jacq references its commitments proactively:

> "Quick check — I'm supposed to chase that invoice today. Want me to send a nudge, or should we push it?"

> "I committed to sending you a venue shortlist this morning. It's ready — [view shortlist]"

### Source Transparency

When Jacq references something it learned or was told:

> "As you mentioned last Tuesday, you want to delay the launch by two weeks."
> [View original conversation]

The user can verify. Trust is built through transparency, not through confidence.

### Weekly Accountability Digest

Every Friday (or user-configured), delivered via Telegram:

> "Week done. Here's my report:
> Completed: 7 things ✓
> Still pending: 2 (I'll carry them forward)
> Missed: 0
> Completion rate this week: 100%"

---

# Pillar 3: Proactive Intelligence

## Positioning

### Headline
> **"Jacq acts before you ask."**

### The Story

Most AI assistants sit there. Waiting. You have to remember to ask them things. You have to initiate every interaction. They're passive tools dressed up as assistants.

Jacq is watching — not in a surveillance way, but in the way a great colleague watches. It spots the double-booking before you do. It notices the email thread that's gone quiet. It sees the gap in your calendar and blocks focus time before someone else fills it. It realises you're in Shoreditch at 2pm and suggests you check if any contacts are nearby for coffee.

Jacq doesn't wait. It notices, decides, and acts — then tells you what it did.

**You didn't hire a reactive chatbot. You hired a PA.**

### Key Messages

| Message | Proof Point |
|---------|-------------|
| "Anticipates, doesn't just respond" | Morning briefing shows day's implications, not just schedule |
| "Spots problems before you do" | Double-booking alerts, missed email detection, deadline proximity |
| "Takes initiative" | Suggests blocking focus time, offers to reschedule, chases stale threads |
| "Thinks ahead" | "Your 2pm is in Shoreditch — leave by 1:15" |

### Tagline Options
- "One step ahead."
- "Proactive. Not passive."
- "The AI that acts first."

---

## In-App Expression: Proactive Intelligence

### Morning Briefing — Implications, Not Just Facts

The briefing is not a calendar readout. It's Jacq's interpretation of what the day means — what you should know, what you might not have noticed, and what it's going to do about it.

**Structure:**
1. Weather and outfit note (based on the day's events)
2. Today's shape — is it a heavy morning? An open afternoon? A day at risk of running over?
3. Heads up — conflicts, tight transitions, things Jacq has already noticed
4. Needs attention — emails that require a response, prioritised by Jacq
5. Proactive suggestion — one action Jacq wants to take, or wants permission to take

### Proactive Notifications

Not alerts — actionable insights:

| Trigger | What Jacq sends |
|---------|-----------------|
| Double-booking | "Double-booked at 2pm. I'd suggest moving the internal sync — want me to email the team with alternatives?" |
| Email from VIP | "Tom's asking about the Q2 plan. I've drafted a response based on your notes — review and send?" |
| Calendar gap | "You've got two hours free tomorrow afternoon. Block for focus time, or leave open for overflow?" |
| Stale follow-up | "You emailed Acme five days ago — no response. Want me to send a polite nudge?" |
| Upcoming trip | "You're in Edinburgh next week. Want me to check if any contacts are nearby for a coffee?" |

### Activity — Patterns Observed

Beyond what Jacq has done and what it's committed to, a third category: **patterns it has noticed**. These are surfaced as conversational moments, not system notifications:

> "I've noticed you always reply to Tom within an hour, but it takes two or three days to respond to supplier emails. Want me to auto-prioritise VIP emails and batch the rest for end of day?"

> "You've cancelled your gym slot three weeks in a row. Want me to move it to a different time, or remove it from the recurring calendar?"

---

# The Fourth Dimension: Trust

## Why Trust Is a Differentiator

The three pillars are about what Jacq does. Trust is about why someone can say yes to it.

Jacq is asking for an extraordinary amount of access: email, calendar, contacts, communication patterns, behavioural data. For most people, this is their entire professional life. The reason someone can agree to that isn't the feature list — it's the confidence that Jacq will handle it responsibly and that they remain in control at all times.

This is where Jacq's architecture is genuinely differentiated:

- **Local-first** — core data stays on the user's device. Cloud LLMs only ever see what is strictly necessary for a specific task.
- **Nothing irreversible without approval** — Jacq drafts and confirms before sending. The first time any external action is taken, explicit approval is required.
- **Everything visible** — the Activity screen is a complete, timestamped log of every action Jacq has taken and why. Nothing is hidden.
- **One-tap off** — a kill switch pauses all autonomous actions instantly.
- **Audit trail** — users can see exactly what data was accessed, when, and for what purpose.

Trust is not a privacy policy. It's designed into the product. And it needs to be expressed in the marketing as clearly as the features are.

### Key Messages

| Message | Proof Point |
|---------|-------------|
| "Your data stays on your device" | Local LLM via desktop app — most processing never leaves the machine |
| "You're always in control" | Nothing is sent, booked, or deleted without approval |
| "Full transparency" | Activity log shows every action, every time |
| "Easy to pause" | Kill switch accessible from any screen |
| "Revoke anytime" | One-tap disconnect from Google; all data deleted on request |

---

# Competitive Differentiation

| Feature | ChatGPT / Claude | Siri / Alexa | Google Assistant | Jacq |
|---------|-----------------|--------------|------------------|------|
| Comes to you (push) | ❌ | Basic | Basic | ✅ |
| Learns your patterns | ❌ | ❌ | Partial | ✅ |
| Remembers commitments | ❌ | ❌ | ❌ | ✅ |
| Transparent memory | ❌ | ❌ | ❌ | ✅ |
| Proactive suggestions | ❌ | Basic | Basic | ✅ Deep |
| Writes in your style | ❌ | ❌ | ❌ | ✅ |
| Gets better over time | ❌ | ❌ | Partial | ✅ |
| Data stays local | ❌ | ❌ | ❌ | ✅ |
| Acts as your proxy | ❌ | ❌ | ❌ | ✅ |

---

# Messaging by Context

## Homepage hero
> "Jacq works for you. You don't work it."

## One-liner
> "Jacq is the PA you've always wanted. It comes to you."

## Three-pillar summary

| Pillar | Headline | What it means |
|--------|----------|---------------|
| Personalisation | "Learns you, not just your data" | Gets better every week. Writes as you, not as AI. |
| Commitment | "Never drops the ball" | Every promise tracked. Full accountability. |
| Proactivity | "Acts before you ask" | Comes to you via Telegram. Anticipates, doesn't react. |

## The underlying story
Jacq is not a better chatbot. It is a different kind of relationship with AI — one where the AI works for you as a proxy, represents you to the world, and earns your trust through transparency and accountability.

---

*Jacq — Learns you. Never forgets. Acts first. Works for you.*
