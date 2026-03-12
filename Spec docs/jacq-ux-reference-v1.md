# Jacq — UI/UX Design Reference

**Version:** 1.1
**Date:** 9 March 2026
**Authors:** JJ / Santy

This document captures the design decisions, principles, and patterns established during the wireframing process. It serves as the reference for visual design, component development, and future feature design.

---

## Design Principles

1. **Calm and confident** — the product should feel assured, never anxious. Generous whitespace. Unhurried typography. Nothing screaming for attention.
2. **Efficiency without coldness** — dense information presented warmly. Every screen should feel like it was designed for a person, not a dashboard.
3. **Read-only by default** — the control panel is transparent, not transactional. Changes happen through conversation with Jacq, not through forms.
4. **One interaction model, everywhere** — whether onboarding, managing memory, or updating a task, the user always talks to Jacq in the same way. No context switching.
5. **Trustworthy** — everything Jacq does is visible. Nothing is hidden. The activity log is always accessible.

---

## Brand Identity

### Logo

**Jacq** — set in Instrument Serif italic, weight 400. Never bold, never upright in logo usage, never uppercase. The gold colour is the only accent allowed on the wordmark.

**Usage:** Sign-in screen, cutscene, onboarding strip, burger nav, desktop app, in-app chat panel header, sidebar of the wireframe viewer.

**Why Instrument Serif italic for the logo:** The italic gives the wordmark a sense of motion and warmth — it leans forward. Instrument Serif is reserved exclusively for the logo; Jacq's conversational voice uses Gilda Display instead.

### Colour

**Gold** (`#B8935A`) — Jacq's primary accent. Used for the wordmark, the JBubble icon, active nav states, memory save confirmations, and the "Jacq Acting" kanban column. Not overused — reserved for things that are specifically Jacq's.

**Warm off-white** (`#F5F2EC`) — page background in light mode. Not pure white. Feels like good paper.

**Dark near-black** (`#131108`) — page background in dark mode. Warm, not cold. Has a slight yellow undertone to complement the gold.

Full token set:

| Token | Light | Dark |
|-------|-------|------|
| `bg` | `#F5F2EC` | `#131108` |
| `surf` | `#FFFFFF` | `#1C1A12` |
| `surf2` | `#EDE8E1` | `#242218` |
| `surf3` | `#E3DDD5` | `#2C2A20` |
| `bord` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.07)` |
| `bord2` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.03)` |
| `t1` (primary text) | `#1A1710` | `#EDE8DF` |
| `t2` (secondary) | `#7A7268` | `#787060` |
| `t3` (tertiary) | `#AEA79E` | `#48443C` |

Status colours (same in both modes):

| Colour | Hex | Usage |
|--------|-----|-------|
| Gold | `#B8935A` | Jacq, active, acting |
| Green | `#3A9468` | Success, connected, done |
| Amber | `#C07B28` | Awaiting approval, waiting |
| Red | `#C0443A` | Errors, destructive actions |
| Blue | `#3060B8` | User-owned tasks, external links |

### Typography

The typeface system is built around a single governing principle: **when Jacq is speaking, the font is Gilda Display**.

**Gilda Display** — Jacq's voice. Used for all conversational messages from Jacq, section headings throughout the control panel, and any display text where Jacq is addressing the user. Regular weight only (Gilda has no bold variant). Colour `#4A4540` in chat — slightly lighter than body text to feel like a considered, unhurried voice rather than a hard statement. Letter spacing `-0.02em`. Line height 1.35.

**Instrument Serif italic** — the logo exclusively. Weight 400, italic. Used only for the Jacq wordmark. Not used for body copy, headings, or any other UI element.

**DM Sans** — all body text, UI labels, buttons, metadata values, and user-generated content. The neutral workhorse. Clean, readable, friendly.

**DM Mono** — metadata, timestamps, key-value labels in data rows, version strings, and the "Saved to memory" label. Maintains legibility at small sizes.

**Type hierarchy summary:**

| Role | Font | Weight | Style | Size |
|------|------|--------|-------|------|
| Wordmark (Jacq logo) | Instrument Serif | 400 | Italic | 28–72px depending on context |
| Jacq's conversational messages | Gilda Display | 400 | Normal | 20px |
| Screen / section titles | Gilda Display | 400 | Normal | 13–17px |
| Body text and labels | DM Sans | 400–600 | Normal | 11–15px |
| Metadata and mono values | DM Mono | 400 | Normal | 10–12px |

---

## Layout

### Mobile Shell

375×780px. Border radius 44px. The notch is simulated at the top. All screens are designed mobile-first.

### Navigation

**Control Panel (Memory, Tasks, Activity, Settings):** bottom tab bar with four items. Persists across all control panel screens.

**Relationships:** no bottom tab bar. Navigation via burger menu only.

**All post-login screens:** burger icon in the top-right corner of the navigation bar.

### Top Navigation Bar

Height approximately 58px including status bar. Contains:
- Back button (if applicable) — square, `surf2` background
- Screen title in Gilda Display, 17px, normal weight
- Optional sub-label below title, 11px DM Sans, `t2`
- Right actions: contextual text action (e.g. "+ Add") in gold, or burger icon

### Bottom Tab Bar

Height 68px. Four tabs: Memory, Tasks, Activity, Settings. Active tab: gold icon and bold label. Inactive: `t3` colour.

---

## Component Library

### JBubble

The core interaction pattern. A small speech-bubble SVG with a "J" in Instrument Serif inside it.

**Dimensions:** 20×20px default; 22×22px for add-row variant.

**Opacity:** 0.45 at rest; 1.0 on hover. Never intrusive.

**Standard variant:** Speech bubble only. Appears at the end of every editable data row. Tapping opens the in-app chat panel with that row as context.

**Add variant:** Speech bubble with a circular gold plus badge at the bottom-right. Appears at the bottom of each section group as a footer row with label "Add to [section] via Jacq".

**Colour:** Always `#B8935A` (Jacq gold). Does not change between light and dark modes.

### Section Labels

Font: Gilda Display, 13px, normal weight. Colour: `t1`. Padding: 14px top, 6px bottom, 18px horizontal. Gilda is used here because section labels are Jacq organising information on the user's behalf — they are Jacq's voice structuring the space.

### Data Rows

Standard row: 10px vertical padding, 14px horizontal. Display: flex, gap 10px.

- Key column: 96–112px wide, 11px DM Mono, `t3`
- Value: flex 1, 12–13px DM Sans, `t1`
- JBubble: flush right, flexShrink 0

Section containers: `surf` background, 14px border radius, `bord` border, overflow hidden. Rows separated by `bord2` 1px dividers.

### Cards (Tasks)

14px border radius. `surf` background. `bord` border. 12px padding. Subtle box shadow. JBubble in top-right of title row. Source metadata in DM Mono 11px `t3` at the bottom.

Add card: dashed border in `bord`, no background fill.

### Tags

Inline pill labels. 2px/7px padding. Border radius 99px. `color18` background (colour at 18% opacity). 10.5px bold text matching the colour.

### Chat Message Style

The in-app chat — used in onboarding and the in-app chat panel — has a deliberately distinct typographic treatment from standard messaging conventions.

**Jacq's messages (JMsg):**
- No speech bubble. Text sits directly on the background.
- Font: Gilda Display, normal, 20px, colour `#4A4540`, line height 1.35, letter spacing `-0.02em`
- Column width constrained to 82% of the screen — breathing room on the right
- Padding: 18px top and bottom. When two Jacq messages appear consecutively, the top padding of the second reduces to 4px so they read as one thought.
- "Saved to memory" confirmation panels appear inline below the message text, in DM Sans, with the gold `goldl` background and `goldb` border

**User's messages (UMsg):**
- Rounded rectangle bubble: `surf2` (`#EDE8E1`) background, border radius 18px, no border, no shadow
- Sits slightly darker than the page background — visible without any outline
- Right-aligned. On short replies, the 18px radius naturally produces a pill shape; on multi-line replies it becomes a proper rounded box.
- Font: DM Sans, 15px, `t1`

**The JBubble chat button (floating variant) is deprecated.** Do not reintroduce. All chat interactions are initiated via the inline JBubble icon pattern.

---

## Screen Inventory

### Onboarding

| Screen | Key characteristics |
|--------|-------------------|
| Sign In | Warm background, Jacq wordmark large in Instrument Serif italic, Google OAuth button, minimal copy |
| Welcome Cutscene | Same warm palette throughout. Jacq wordmark in Instrument Serif italic at 72px. Introductory copy in Gilda Display. Unhurried. Transitions to conversation. |
| Intro Conversation | Slim logo strip header (Instrument Serif italic wordmark). Jacq messages in Gilda Display, unbubbled. User messages in `surf2` rounded boxes. Memory saves shown inline as gold panels. |
| Connect Gmail | Conversational continuation of the intro. Same chat style. Will/won't card. Dedicated address recommendation in Jacq's voice. Skip always available. |
| Connect Calendar | Same pattern. Calendar-specific will/won't. Same recommendation framing. |

### Control Panel

| Screen | Key characteristics |
|--------|-------------------|
| Memory | Search bar. Four sections. Key/value rows. JBubble on every row and section footer. Burger nav. Bottom tab bar. |
| Tasks Kanban | Column filter chips. Cards per column. JBubble on card title. Dashed add card. Done log. Burger nav. Bottom tab bar. |
| Task Detail | Status metadata strip. Working notes with gold confirmation panel. Sub-tasks with JBubble and owner tags. People with JBubble. Add rows. Burger nav. |
| Activity | Pending approvals (amber left border). Done log (timestamped). Autonomy level selector. Pause button. JBubble on all rows. Burger nav. Bottom tab bar. |

### Relationships

| Screen | Key characteristics |
|--------|-------------------|
| Relationships | Burger nav only (no footer). Search. VIP cards (expanded). Others list (compact). JBubble on all. Add row. |
| Relationship Detail | Header card with tags. Jacq's context section. Communication preferences section. Open items section. JBubble and add rows on all. Burger nav. |

### Settings

| Screen | Key characteristics |
|--------|-------------------|
| Settings | Six groups. Row-based. JBubble on all non-destructive rows. Destructive rows in red without JBubble. Burger nav. Bottom tab bar. |

### Desktop

| Screen | Key characteristics |
|--------|-------------------|
| Menu Bar | 260px dark panel. Jacq avatar and logo. Model status. Token split bar. Browser toggle. Current task. Menu items. |
| Expanded | 340px dark panel. Model selector with three options. Browser automation details. Token usage breakdown. System resources. |

### Overlays

| Screen | Key characteristics |
|--------|-------------------|
| Burger Nav | Full-screen, same surface as current screen. Jacq wordmark. Five section links. Dark/light toggle. Message Jacq shortcut. Version. |
| In-App Chat Panel | Slides up 72% of screen height. Handle bar. Context label (DM Mono) showing source screen/section. Jacq messages in Gilda Display unbubbled. User messages in `surf2` rounded boxes. Input bar with send button. X to close. |

---

## Onboarding Tone

The onboarding sequence is a single continuous experience. The aesthetic match between onboarding and the control panel is intentional — users should feel they have entered the product, not passed through a funnel to reach it.

The welcome cutscene is calm and assured, not dramatic. No dark cinematic opening. The same warm palette. Jacq's introduction reads like meeting a trusted colleague for the first time, not a product reveal.

The intro conversation sets the personality immediately: direct, warm, curious, never servile. Jacq asks considered questions one at a time. Everything saved is shown to the user in-line as a gold confirmation panel — transparency from the very first interaction.

---

## Dark and Light Modes

Both modes use the same warm undertone — this is not a cold "developer dark mode". The dark palette uses near-black with a slight yellow cast (`#131108`) and surfaces with warm brown-blacks. Gold retains full saturation in both modes.

The toggle is accessible from:
- The burger nav overlay
- The sidebar in the wireframe viewer

Default is light mode.

---

## Accessibility Considerations (for build phase)

- All interactive elements should have minimum 44×44px touch targets
- Colour contrast: all body text meets WCAG AA (4.5:1 minimum)
- JBubble icons include a `title` attribute for screen readers
- Focus states required on all interactive elements
- Dark/light mode preference should respect `prefers-color-scheme` by default

---

*End of UI/UX Design Reference*
