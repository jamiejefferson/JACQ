# Environment variables (.env.local)

Copy `.env.local.example` to `.env.local`, then fill in the values below. Never commit `.env.local`.

## Required for the app (and Telegram setup)

### 1. Supabase Cloud: URL and keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. In the left sidebar, click the **gear icon** (**Project Settings**).
3. Click **API** in the left sub-menu.
4. You’ll see:
   - **Project URL** → copy this into `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
   - **Project API keys**:
     - **anon** **public** → copy into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
     - **service_role** **secret** → copy into `SUPABASE_SERVICE_ROLE_KEY` (needed for Telegram “Set up” / Save token; never expose in the browser).

Example of what you add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Your values will be different.)

## Optional

- **Telegram**: You can set up entirely in the app (Settings → Integrations → Telegram → Set up, then paste the token). No need to put the bot token in `.env.local` unless you prefer it.
- **NEXT_PUBLIC_APP_URL**: Only needed when the app is deployed and you want the Telegram webhook set automatically. Set it to your public app URL (e.g. `https://your-app.vercel.app`). Leave blank for local dev.

After editing `.env.local`, restart the dev server (`npm run dev`).
