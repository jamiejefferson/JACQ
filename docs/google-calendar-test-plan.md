# Google Calendar Integration — Test Plan

## Pre-requisites

- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in Vercel env vars
- [ ] Same values set in `.env.local` for local dev
- [ ] Vercel deploy is live with latest code

---

## Phase 1: Token Capture

### Test 1.1 — Fresh sign-in captures tokens
1. Open https://jacq-sage.vercel.app (or log out first)
2. Sign in with Google — you should see the Google consent screen (because of `prompt: consent`)
3. After redirect, open Supabase Dashboard > Table Editor > `user_integrations`
4. Filter by your `user_id`
5. **Expected:** All three rows (gmail, calendar, drive) have:
   - `access_token`: a long base64 encrypted string (NOT a raw Google token)
   - `refresh_token`: a long base64 encrypted string
   - `token_expiry`: a timestamp ~1 hour in the future
   - `status`: "active"

### Test 1.2 — Settings reconnect also captures tokens
1. Go to Settings > Integrations
2. If Gmail/Calendar show "Connected", manually clear `access_token` in Supabase for one row
3. The row should now show "Connect" button (or just click Connect on any Google row)
4. Complete the Google consent flow
5. **Expected:** Same as 1.1 — tokens are populated again

### Test 1.3 — Null refresh token handling
1. If `provider_refresh_token` is null (can happen if Google doesn't return it), the callback should still work
2. **Expected:** `refresh_token` column is null, but `status` is still "active" and `access_token` is populated
3. Note: This means token refresh won't work — but sign-in doesn't break

**Debugging tips:**
- If tokens are null after sign-in: check that `queryParams: { access_type: "offline", prompt: "consent" }` is present in both OAuth calls
- If you see a raw Google token (starts with `ya29.`): the encryption isn't running — check the `encryptApiKey` import in `callback/route.ts`
- If the consent screen doesn't appear: Google may be using a cached grant. Try revoking access at https://myaccount.google.com/permissions first

---

## Phase 2: Token Refresh

### Test 2.1 — Auto-refresh on expired token
1. In Supabase, manually set `token_expiry` to a past date for the `calendar` row (e.g. `2024-01-01T00:00:00Z`)
2. Send a message in Jacq: "What's on my calendar this week?"
3. **Expected:** Jacq responds with calendar events (not an error)
4. Check Supabase: `token_expiry` should now be ~1 hour in the future for ALL three Google rows

### Test 2.2 — Revoked token handling
1. Go to https://myaccount.google.com/permissions and revoke Jacq's access
2. In Supabase, set `token_expiry` to a past date (to force a refresh attempt)
3. Send a calendar query in Jacq
4. **Expected:**
   - Jacq responds with a message like "Google Calendar not connected. Please reconnect in Settings."
   - All three Google rows in Supabase now have `status: "revoked"`

### Test 2.3 — Missing env vars
1. Temporarily remove `GOOGLE_CLIENT_ID` from env
2. Force a token refresh (set `token_expiry` to past)
3. Send a calendar query
4. **Expected:** Jacq says Calendar is not connected (fails gracefully, no crash)
5. **Restore** the env var after testing

**Debugging tips:**
- Check Vercel function logs for `Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET` message
- If refresh keeps failing: decrypt the refresh_token manually to verify it's valid — or just reconnect Google

---

## Phase 3: Calendar Tools

### Test 3.1 — List events (web chat)
1. Open Jacq web UI
2. Send: "What's on my calendar this week?"
3. **Expected:** Jacq lists your real Google Calendar events with day, time, and title
4. Verify the events match what's in your actual Google Calendar

### Test 3.2 — List events (Telegram)
1. Send the same message via Telegram
2. **Expected:** Same events, formatted for plain text (no markdown)

### Test 3.3 — List events with filter
1. Send: "Do I have any meetings about [specific topic] this week?"
2. **Expected:** Only events matching the query are shown, or "No events found" if none match

### Test 3.4 — List events (empty calendar)
1. Send: "What's on my calendar on December 25?"
2. **Expected:** "No events found" message (assuming your calendar is empty that day)

### Test 3.5 — Create event (web chat)
1. Send: "Schedule a test meeting tomorrow at 2pm for 30 minutes"
2. **Expected:** Jacq should confirm details before creating (summary, time, duration)
3. Confirm
4. **Expected:** Jacq creates the event and confirms with the event title
5. Check Google Calendar — the event should be there

### Test 3.6 — Create event (Telegram)
1. Same as 3.5 but via Telegram
2. **Expected:** Same behaviour

### Test 3.7 — Update event
1. First list events to get an event ID (the `[id:...]` in the response)
2. Send: "Move my [event name] to 3pm"
3. **Expected:** Jacq confirms the change, then updates it
4. Check Google Calendar — the event should be at the new time

### Test 3.8 — Calendar not connected
1. In Supabase, set `status` to "revoked" for the calendar row
2. Send: "What's on my calendar?"
3. **Expected:** Jacq tells you to reconnect Google in Settings (not a crash or generic error)
4. **Restore** status to "active" after testing

**Debugging tips:**
- If Jacq responds but doesn't show calendar data: the follow-up LLM call may not be working. Check Vercel logs for the second API call
- If you see `Calendar API error: ...`: the access token may be invalid. Check `token_expiry` and try reconnecting
- If the LLM doesn't use the calendar tool: check that `ALL_TOOLS` (not `EXTRACTION_TOOLS`) is being passed in `llm-client.ts`
- If the tool is called but data doesn't come back: check that `tool-execution.ts` returns `data` field, and `chat/route.ts` does the follow-up call

---

## Phase 5: Multi-turn Tool Loop

### Test 5.1 — Web chat follow-up call
1. Send a calendar query on web
2. Check Vercel function logs
3. **Expected:** Two Anthropic API calls — first returns `tool_use`, second returns the formatted text response

### Test 5.2 — Telegram follow-up call with data
1. Send a calendar query on Telegram
2. **Expected:** Jacq responds with formatted calendar events (not "Done! I've saved that.")

### Test 5.3 — Extraction tools still work (no regression)
1. Send: "I prefer morning meetings"
2. **Expected:** Jacq acknowledges and saves an understanding entry (check `understanding_entries` in Supabase)
3. The existing follow-up flow for non-data tools should still work

### Test 5.4 — Mixed tool calls
1. Send: "What's on my calendar tomorrow? Also, remind me that I prefer mornings for deep work."
2. **Expected:** Jacq should use `calendar_list_events` AND `extract_understanding`, then respond with calendar data and acknowledge the preference

---

## Phase 6: Context & Prompt

### Test 6.1 — Integration status in context
1. With Google connected, send any message
2. Check Vercel logs for the system prompt
3. **Expected:** Contains "Google Calendar: Connected — calendar tools available"

### Test 6.2 — Not connected status
1. Disconnect Google (set status to "not_connected" in Supabase)
2. Send a message
3. **Expected:** Context shows "Google Calendar: Not connected"

---

## Regression Tests

- [ ] Existing tools (extract_understanding, create_task, extract_contact, etc.) still work on web
- [ ] Existing tools still work on Telegram
- [ ] Onboarding flow still works (sign in > connect Google > complete)
- [ ] Settings page loads without errors
- [ ] Web chat still streams responses correctly
- [ ] Telegram typing indicator still shows
- [ ] Users who skip Google connection can still chat normally

---

## Known Limitations

- **Existing users must reconnect:** Anyone who connected Google before this change won't have tokens stored. They need to click Connect in Settings once.
- **One calendar only:** Currently reads from "primary" calendar only. Users with multiple calendars won't see events from secondary calendars.
- **Gmail tools not yet implemented:** Only calendar tools are active. Email tools come in Phase 4.
- **No timezone handling:** Event times are returned as-is from Google. If the user's timezone differs from their calendar timezone, times may look wrong.
