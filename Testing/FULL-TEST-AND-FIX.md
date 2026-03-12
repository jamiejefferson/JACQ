# Full Test and Fix — Process

This document defines what a **full test and fix** means and how to run it. Use it whenever the user (or CLAUDE.md) asks to "check," "test," or "fix" the app in a complete, spec-driven way.

---

## Definition

A full test and fix is **done** only when:

1. **Build passes** — `npm run build` completes with no errors.
2. **Every applicable item** in [TEST-CHECKLIST.md](TEST-CHECKLIST.md) has been run and **passes** (or is explicitly N/A for the current scope).
3. Any failure has been **fixed** and the checklist **re-run** until all items pass.

Until then, the task is not complete.

---

## Source of truth

- **Requirements:** [jacq-functional-spec.md](../Spec%20docs/jacq-functional-spec.md) (v1.0) and [jacq-functional-spec-addendum.md](../Spec%20docs/jacq-functional-spec-addendum.md) (v1.1) — every screen, component, interaction, and state is specified there; the addendum supersedes §3 Onboarding, parts of §13 Chat, and §15 Data Models where stated.
- **Test list:** [TEST-CHECKLIST.md](TEST-CHECKLIST.md) — the enumerated, testable form of the spec. Each checklist item maps to one or more spec requirements.

---

## Visual verification

Items in the checklist marked **Visual** must be verified by **appearance**, not only by:

- Accessibility tree / snapshot
- Network requests
- Console (no errors)

For **Visual** items, verify by:

- **Screenshot** — confirm layout, background, and tokens look correct (e.g. cream background in light mode, not solid black).
- **Computed styles** — e.g. `getComputedStyle(document.body).backgroundColor` or equivalent for the main container, to confirm design tokens are applied.

**Important:** In light mode (default), the page background must use the light design token (e.g. `#f5f2ec` / `var(--jacq-bg)`). It must **not** appear as solid black unless the user has explicitly turned on dark mode.

---

## Order of operations

1. **Run build** — `npm run build`. Fix any errors or blocking warnings until the build is green.
2. **Start the app** — e.g. `npm run dev`. Open the app in the browser (fresh session or incognito if testing auth).
3. **Run the checklist** — Work through [TEST-CHECKLIST.md](TEST-CHECKLIST.md) section by section (Auth → Design → Onboarding → Understanding → … → Error states). For each item:
   - Perform the action or navigation.
   - Confirm the expected outcome (and for **Visual** items, confirm appearance).
   - If it fails: note the failure, fix the code, re-run build, then re-run the affected checklist items (and any dependent ones).
4. **Done** — Only when build passes and the full checklist passes. Optionally, get user confirmation that there are no remaining issues.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Build passes |
| 2 | Run every applicable item in TEST-CHECKLIST.md (browser + visual where marked) |
| 3 | Fix failures → re-run build → re-run affected checklist items |
| 4 | Consider done only when build + full checklist pass |
