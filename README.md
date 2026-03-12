# Jacq — Walking Skeleton

Product prototype: Sign In, onboarding, and post-login control panel (Understanding, Tasks, Activity, Settings, Relationships). Mobile-first UI per spec and wires.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. **http://localhost:3000** or, if that port is in use, **http://localhost:3001**). You will be redirected to `/sign-in`.

**If the page is blank:** check the terminal for the correct port, open DevTools (F12) → Console for errors, and try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R). The app sends full HTML from the server, so you should see the Sign In screen even before JavaScript runs.

## Auth (optional)

To use Google OAuth:

1. Copy `.env.local.example` to `.env.local`.
2. Create a [Supabase](https://supabase.com) project and add your URL and anon key.
3. In Supabase: **Authentication → Providers** enable Google and add your Google OAuth client ID/secret.
4. In **Authentication → URL Configuration** add redirect URL: `http://localhost:3000/auth/callback`.

Without these env vars, the app still runs: middleware skips auth and you can open `/sign-in`, `/onboarding`, and `/app` directly.

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
| `/` | Redirects to `/sign-in` (or `/onboarding`/`/app` when auth is configured and session exists). |
| `/sign-in` | Sign In screen; "Continue with Google" starts OAuth when Supabase is configured. |
| `/auth/callback` | OAuth callback; exchanges code for session and redirects to `/onboarding`. |
| `/onboarding` | Cutscene → Intro conversation → Connect step; "Continue" / "Skip" sets onboarding complete and redirects to `/app`. |
| `/app` | Understanding (Memory). |
| `/app/tasks` | Tasks kanban; first "To Do" card links to task detail. |
| `/app/tasks/[id]` | Task detail (e.g. Team offsite). |
| `/app/activity` | Activity (commitments, actions, patterns, autonomy). |
| `/app/settings` | Settings groups. |
| `/app/relationships` | Relationships list; Sarah Mitchell links to relationship detail. |
| `/app/relationships/[id]` | Relationship detail. |

## Deferred (out of scope)

- Brochureware (pre-login): Homepage, Pricing, Sign Up, Guide.
- Real Gmail/Calendar integrations.
- Telegram bot.
- Desktop app.
- In-app chat panel (JBubble is visual only).
- Real CRUD for Memory/Tasks/Activity (data is static).

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS.
- Supabase Auth (Google OAuth) when env is set.
- Design tokens and typography from `Spec docs/jacq-ux-reference-v1.md`; wire content from `Wires/jacq-wireframes-v6.jsx`.
