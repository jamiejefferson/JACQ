# Deploy to Vercel so Telegram connect works

No code changes are required. The app already uses `VERCEL_URL` when present to register the webhook when you save the token (`app/api/telegram/setup/route.ts`).

## 1. Deploy the app

- Connect the repo to Vercel and deploy (e.g. from the Vercel dashboard or CLI).
- Use the same Supabase project you use locally (same DB and migrations).

## 2. Set environment variables in Vercel

In the Vercel project: **Settings → Environment Variables**. Add the same vars you have in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

You do **not** need to set `NEXT_PUBLIC_APP_URL` or `TELEGRAM_BOT_TOKEN` for the flow to work: Vercel sets `VERCEL_URL`, and the bot token is stored in the DB when you paste it in the app.

## 3. Database

Ensure your Supabase project has the Telegram tables (e.g. you've run `supabase/APPLY_FULL_SCHEMA.sql` or the migrations that create `telegram_bot_config` and `telegram_link_tokens`). Same DB is used by local and Vercel.

## 4. After the first deploy

- Open the **deployed** app URL (e.g. `https://your-app.vercel.app`).
- Go to **Settings → Integrations → Telegram**.

If you only ever saved the token **locally**, the token is already in the DB (same Supabase), but the webhook may still be unset or pointing at localhost/ngrok. Do one of:

- **Option A:** Tap **Connect**. In the modal, tap **Register webhook** (the deployed app's URL will be used). Then tap **Open Telegram** and **Start** in the bot chat.
- **Option B:** Tap **Set up** again, re-paste the same token, and **Save**. That registers the webhook to the Vercel URL. Then **Connect** → **Open Telegram** → **Start**.

After that, Telegram will show as Connected and future Connects will work without re-registering.

## 5. Proactivity (optional)

Jacq can send check-ins via Telegram at **Morning**, **After lunch**, and **End of day** (default times 07:30, 13:00, 17:30 in the user's timezone). Users edit these in **Settings → Proactivity**.

For the scheduled job to run on Vercel, set **CRON_SECRET** in the project's Environment Variables (any secret string). Vercel Cron will call `/api/proactive/run` every 15 minutes and send the header `Authorization: Bearer <CRON_SECRET>`. If you don't set CRON_SECRET, the cron still runs but the route may reject the request; set it so the run succeeds.
