# LLM connectivity

## Timeout and retry (Anthropic only)

Outbound requests to the LLM use a **55-second timeout** and **one retry** for transient failures so the app can surface a clear error instead of hanging or failing silently.

- **Where:** `lib/llm-client.ts` — `anthropicFetch()` used by `completeWithTools` and `completeWithToolsRaw`.
- **Timeout:** 55s (kept under the chat route `maxDuration` of 60s so the server can emit a proper error to the client).
- **Retry:** One retry after 1.5s for:
  - HTTP 5xx responses, or
  - Network/abort errors (e.g. timeout, ECONNRESET, ETIMEDOUT).

Timeout errors are shown to the user as: *"Connection to the AI timed out. Try again in a moment."*

**Provider scope:** This behaviour applies only to **Anthropic**. In the current build, chat and tool use call only the Anthropic Messages API; the "Jacq" fallback (no user API key) also uses Anthropic via `ANTHROPIC_API_KEY`. If OpenAI or Google are added for the same chat/tool flow, equivalent timeout (and optionally retry) logic should be added for those providers.

## Client: incomplete stream

If the response stream ends without a `done` event (e.g. server killed, connection dropped), the chat panel treats it as a lost connection and shows: *"Connection to the AI was lost. Tap to retry."* See `components/chat-panel.tsx`.
