# Plan: Google Calendar & Gmail API Integration

## Context

Jacq's walking skeleton has Google OAuth working (users sign in and grant Gmail + Calendar scopes), but there's no actual Google API integration. The auth callback marks integrations as "connected" without capturing the provider tokens, and there are no tools for reading email, listing calendar events, or creating drafts/events. This plan adds the full pipeline: token capture → token refresh → Google API tools → LLM wiring.

---

## Phase 1: Capture & Store Google Tokens

**Problem:** `exchangeCodeForSession()` returns `provider_token` and `provider_refresh_token` on the session object, but the callback ignores them. Google also only returns a `refresh_token` when `access_type=offline` and `prompt=consent` are set.

### Files to modify

**`app/onboarding/connect/page.tsx`** (line ~20)
- Add `queryParams: { access_type: "offline", prompt: "consent" }` to the `signInWithOAuth` options
- Same change in `app/app/settings/page.tsx` (line ~100) for the reconnect flow

**`app/auth/callback/route.ts`** (line ~16 onwards)
- After `exchangeCodeForSession(code)`, extract `data.session.provider_token` and `data.session.provider_refresh_token`
- Encrypt both using existing `encryptApiKey()` from `lib/llm-encrypt.ts`
- Store in the `user_integrations` upsert: populate `access_token`, `refresh_token`, `token_expiry` (now + 3500s) columns
- All three Google rows (gmail, calendar, drive) get the same token since it's one OAuth grant

### New env vars (add to `.env.local.example`)
- `GOOGLE_CLIENT_ID` — needed for token refresh (same value as configured in Supabase Google provider)
- `GOOGLE_CLIENT_SECRET` — needed for token refresh (same value as configured in Supabase Google provider)

---

## Phase 2: Google API Client with Token Refresh

### New file: `lib/google-client.ts`

Core function: `getGoogleAccessToken(supabase, userId, provider)`:
1. Read `user_integrations` row for the provider (e.g. "calendar")
2. Decrypt `access_token` and `refresh_token` using `decryptApiKey()`
3. If `token_expiry` is > 60s in the future, return the access token
4. Otherwise, POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token`, `refresh_token`, `client_id`, `client_secret`
5. Encrypt and save the new access token + expiry back to the DB
6. If refresh fails (token revoked), update status to `"revoked"` and return null

Helper functions for Google API calls:
- `googleCalendarFetch(accessToken, path, options)` — wrapper around `fetch` for Calendar API
- `googleGmailFetch(accessToken, path, options)` — wrapper for Gmail API
- `decodeBase64Url(str)` — for decoding Gmail message body parts

---

## Phase 3: Calendar Tools (3 tools)

### `lib/llm-tools.ts` — Add definitions

| Tool | Description | Key params |
|------|-------------|------------|
| `calendar_list_events` | List upcoming events | `days_ahead` (default 7), `query` (optional filter) |
| `calendar_create_event` | Create event (confirm first) | `summary`, `start_time`, `end_time`, `description`, `attendees`, `location` |
| `calendar_update_event` | Update event (confirm first) | `event_id`, `summary`, `start_time`, `end_time`, `description` |

### `lib/tool-execution.ts` — Add execution

Each calendar tool:
1. Call `getGoogleAccessToken(supabase, userId, "calendar")`
2. If null → return `{ ok: false, reason: "Google Calendar not connected. Ask user to reconnect in Settings." }`
3. Call the Google Calendar REST API:
   - **list**: `GET /calendar/v3/calendars/primary/events?timeMin=...&timeMax=...&singleEvents=true&orderBy=startTime`
   - **create**: `POST /calendar/v3/calendars/primary/events` with JSON body
   - **update**: `PATCH /calendar/v3/calendars/primary/events/{eventId}` with JSON body
4. Return `{ ok: true, tool, data: formattedEvents }` — needs `data` field on ToolResult

### ToolResult type change

Extend the success type in `tool-execution.ts`:
```typescript
{ ok: true; tool: string; label?: string; section?: string; data?: string }
```
The `data` field holds a text summary of API results (e.g. formatted event list) that gets passed back to the LLM.

---

## Phase 4: Gmail Tools (3 tools)

### `lib/llm-tools.ts` — Add definitions

| Tool | Description | Key params |
|------|-------------|------------|
| `email_search` | Search Gmail | `query` (Gmail search syntax), `max_results` (default 10) |
| `email_read` | Read a specific email | `message_id` |
| `email_draft` | Create a draft (confirm first) | `to`, `subject`, `body`, `cc` |

### `lib/tool-execution.ts` — Add execution

- **email_search**: `GET /gmail/v1/users/me/messages?q=...&maxResults=...`, then batch-fetch snippets for each message ID. Return formatted list (from, subject, date, snippet, id).
- **email_read**: `GET /gmail/v1/users/me/messages/{id}?format=full`, parse MIME parts, decode base64url body. Return formatted email (from, to, subject, date, body).
- **email_draft**: `POST /gmail/v1/users/me/drafts` with RFC 2822 message. Return confirmation with draft ID.

---

## Phase 5: Wire Data-Returning Tools into Chat Loop

**Problem:** Current web chat (`app/api/chat/route.ts`) executes tools but doesn't feed the result data back to the LLM. When `calendar_list_events` returns event data, the LLM never sees it.

### `app/api/chat/route.ts` — Add multi-turn tool loop

After executing tools, if any returned `data`:
1. Build follow-up messages with `tool_use` blocks (assistant) and `tool_result` blocks (user) containing the data
2. Call `completeWithToolsRaw()` (already exists in `lib/llm-client.ts`)
3. Use the follow-up response content as the final reply

The Telegram webhook (`app/api/telegram/webhook/route.ts`) already has this pattern — update its tool result building to include the `data` field.

---

## Phase 6: Context & Prompt Updates

### `lib/context.ts`
- Add integration status query in `assembleContext()` for gmail/calendar
- Add "Integrations" section in `formatContextBlock()` showing connected status
- This tells the LLM whether it can use Google tools or not

### `lib/system-prompt.ts`
- Add to autonomy guidelines:
  - "You can read calendar events and search emails without asking"
  - "Creating events or drafting emails: confirm with the user first"
  - "When showing calendar events, format clearly with date, time, title"
  - "When showing emails, include sender, subject, date, and snippet"

---

## Implementation Order

1. **Phase 1** (tokens) — nothing works without this
2. **Phase 2** (google-client) — prerequisite for all tools
3. **Phase 3** (calendar) + **Phase 5** (chat loop) — calendar is simpler, good to test the full pipeline
4. **Phase 4** (gmail) — follows same pattern
5. **Phase 6** (prompts) — alongside phases 3-4
6. After each phase: commit, push, deploy, test on Telegram

---

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `app/onboarding/connect/page.tsx` | Modify — add queryParams | 1 |
| `app/app/settings/page.tsx` | Modify — add queryParams | 1 |
| `app/auth/callback/route.ts` | Modify — capture & encrypt tokens | 1 |
| `.env.local.example` | Modify — add GOOGLE_CLIENT_ID/SECRET | 1 |
| `lib/google-client.ts` | **New** — token refresh + API helpers | 2 |
| `lib/llm-tools.ts` | Modify — add 6 tool definitions | 3, 4 |
| `lib/tool-execution.ts` | Modify — add 6 tool cases + ToolResult.data | 3, 4 |
| `app/api/chat/route.ts` | Modify — multi-turn tool loop | 5 |
| `app/api/telegram/webhook/route.ts` | Modify — include data in tool results | 5 |
| `lib/context.ts` | Modify — add integration status | 6 |
| `lib/system-prompt.ts` | Modify — add Google guidelines | 6 |

### Existing code to reuse
- `lib/llm-encrypt.ts` — `encryptApiKey()` / `decryptApiKey()` for token encryption
- `lib/llm-client.ts` — `completeWithToolsRaw()` for follow-up calls after tool execution
- `lib/supabase/admin.ts` — `createAdminClient()` for webhook token access

---

## Potential Pitfalls

1. **`provider_refresh_token` may be null** if user previously granted access without `prompt=consent`. The forced re-consent should fix this, but handle null gracefully.
2. **Token stored in 3 rows** (gmail, calendar, drive) — refresh one = must update all three, or just read from one canonical row (e.g. "calendar") for refresh.
3. **RLS on user_integrations** — the callback uses the user's Supabase client. The session should be valid right after `exchangeCodeForSession`, but verify the upsert succeeds.
4. **Vercel function timeout** — Gmail batch-fetching multiple message snippets could be slow. Limit `max_results` to 10 and fetch snippets in parallel.
5. **Users must reconnect** — existing users who connected before this change won't have tokens stored. The settings page reconnect flow handles this.

---

## Testing Checklist

### Token capture
- [ ] Sign in via Google on deployed app
- [ ] Check `user_integrations` in Supabase Dashboard — `access_token` and `refresh_token` should be non-null encrypted strings
- [ ] `token_expiry` should be ~1 hour in the future

### Token refresh
- [ ] Manually set `token_expiry` to a past date in DB
- [ ] Send a calendar query via chat — should auto-refresh and respond
- [ ] Check DB — `token_expiry` should be updated to new future time

### Calendar
- [ ] "What's on my calendar this week?" → lists real events
- [ ] "Schedule a meeting with X tomorrow at 2pm" → confirms then creates
- [ ] Verify event appears in Google Calendar
- [ ] Same queries work via Telegram

### Gmail
- [ ] "Any emails from [name] this week?" → returns real email snippets
- [ ] "Read the first one" → returns full email content
- [ ] "Draft a reply saying I'll be there" → creates draft
- [ ] Verify draft appears in Gmail

### Error handling
- [ ] Revoke Google access in Google Account settings → next query returns friendly "please reconnect" message
- [ ] User without Google connected → tools fail gracefully, LLM explains what to do

### Regression
- [ ] Existing tools (extract_understanding, create_task etc.) still work
- [ ] Web chat still works
- [ ] Telegram chat still works
- [ ] Onboarding flow unaffected
