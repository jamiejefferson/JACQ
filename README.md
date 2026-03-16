# Jacq — Walking Skeleton

Product prototype: Sign In, onboarding (welcome → LLM setup → conversation → Connect Google), and post-login app (Home, Understanding, Tasks, Activity, Relationships, Settings). Mobile-first UI with desktop bezel (20px band above/below the viewer). In-app chat panel, delete account, and Google/Gmail/Calendar/Drive connect via OAuth.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. **http://localhost:3000** or **http://localhost:3007** if you use `npm run dev:clean`). You will be redirected to `/sign-in` when unauthenticated.

**If the page is blank:** check the terminal for the correct port, open DevTools (F12) → Console for errors, and try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R).

## Auth (optional)

To use Google OAuth:

1. Copy `.env.local.example` to `.env.local`.
2. Create a [Supabase](https://supabase.com) project and add your URL and anon key.
3. In Supabase: **Authentication → Providers** enable Google and add your Google OAuth client ID/secret.
4. In **Authentication → URL Configuration** add the exact redirect URL (e.g. `http://localhost:3007/auth/callback`).

Run the full schema once (Supabase Dashboard → SQL Editor → run `supabase/APPLY_FULL_SCHEMA.sql`) so `public.users` and `user_integrations` exist. Without these env vars and tables, the app still runs but auth and Connect Google will fail.

See [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md) for troubleshooting. For LLM timeout, retry, and provider scope (Anthropic-only in the current build), see [docs/LLM_CONNECTIVITY.md](docs/LLM_CONNECTIVITY.md).

## Deployer setup: Telegram (optional)

Only the person/team that deploys the app configures Telegram. End users never set tokens.

1. **Create a bot** in Telegram via [@BotFather](https://t.me/BotFather): send `/newbot`, follow the prompts, and get the bot **token** and **username** (e.g. `MyApp_bot`).
2. **Set environment variables** in your deployment (e.g. Vercel env or server `.env`):
   - `TELEGRAM_BOT_TOKEN` — the secret token from BotFather (server-only; never exposed to the client).
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — the bot username (e.g. `MyApp_bot`), used to build the connect link.
   The app also needs Supabase: set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` so the webhook can link users (the service role bypasses RLS).
3. **Register the webhook** once after deployment. Call the Telegram API:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" -d "url=https://your-domain.com/api/telegram/webhook"
   ```
   Replace `<YOUR_TELEGRAM_BOT_TOKEN>` and `your-domain.com` with your bot token and public app URL. The webhook URL must be HTTPS.

After this, users can connect Telegram from **Settings → Integrations** by tapping **Connect** and then **Open Telegram** and **Start** in the chat; no codes or env setup for end users.

See `docs/telegram-setup.md` for more detail.

## Deploy on Vercel

To host on Vercel and have Telegram connect work: set the Supabase env vars in Vercel, deploy, then register the webhook or re-save the token from the deployed app. See [docs/vercel-deploy.md](docs/vercel-deploy.md).

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/sign-in`, `/onboarding`, or `/app` based on auth and onboarding state. |
| `/sign-in` | Sign In; "Continue with Google" starts OAuth (redirects to provider URL when configured). |
| `/auth/callback` | OAuth callback; exchanges code for session, ensures `public.users` and `user_integrations` (gmail/calendar/drive) when from Google, redirects to `?next=` or `/onboarding`. |
| `/onboarding` | Redirects to welcome or next step. |
| `/onboarding/welcome` | Welcome cutscene; CTA → LLM step. |
| `/onboarding/llm` | LLM setup (own key or local); validate key, select model, Continue → conversation. |
| `/onboarding/conversation` | Onboarding chat; extract_understanding → Saved panels; "Done for now" → jump-off summary card; "Connect my accounts" → connect. |
| `/onboarding/connect` | Connect Google (OAuth) or Skip; success → `/onboarding/connect/complete` then `/app`. |
| `/onboarding/connect/complete` | Post-connect; redirects to `/app`. |
| `/app` | Home ("What to do next" — ideas, links to Understanding/Tasks/Relationships/Settings). |
| `/app/understanding` | Understanding (Jacq's picture of you); sections, DataRows, JBubble, chat panel. |
| `/app/tasks` | Tasks kanban; "+ Add" opens chat; cards → task detail. |
| `/app/tasks/[id]` | Task detail. |
| `/app/activity` | Activity (commitments, completion rate, pause/resume autonomy). |
| `/app/relationships` | Relationships list; cards → relationship detail. |
| `/app/relationships/[id]` | Relationship detail. |
| `/app/settings` | Settings (Integrations, AI & Desktop, Communication style, Quiet hours, Delete account, Log out). |
| `/app/settings/audit-log` | Audit log. |

## Implemented (current)

- Google OAuth sign-in; auth callback creates/updates `public.users` and records gmail/calendar/drive in `user_integrations`.
- Connect Google from onboarding and from Settings → Integrations (Gmail, Google Calendar, Google Drive).
- Onboarding: welcome → LLM (own API key with model picker) → conversation (with jump-off summary card) → connect or skip.
- Home screen after onboarding; Understanding, Tasks, Activity, Relationships, Settings; in-app chat panel (JBubble opens chat with context).
- Delete account (and all my data) in Settings with confirmation modal; `DELETE /api/users/me` and cascade.
- Desktop: 20px bezel above/below viewer; burger menu contained within same viewer frame.
- Telegram: optional; deployer sets bot token (env or in-app Set up); users Connect via link; webhook at `/api/telegram/webhook`.

## Deferred (out of scope for skeleton)

- Brochureware (pre-login): Homepage, Pricing, Sign Up, Guide.
- Real Gmail/Calendar API usage (read/send); currently only connection status is stored.
- Desktop app; local LLM (UI shows "Not set up").
- Full CRUD for Memory/Tasks/Activity beyond current API and chat extraction.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS.
- Supabase Auth (Google OAuth); `public.users` and `user_integrations` (including gmail/calendar/drive) created/updated on callback.
- Design tokens and typography from `Spec docs/jacq-ux-reference-v1.md`; wire content from `Wires/jacq-wireframes-v6.jsx`.
