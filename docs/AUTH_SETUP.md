# Sign-in (Google) setup

If you can’t log in in the browser, work through this checklist.

---

## Database: “Could not find the table 'public.user_integrations'”

If you see **"relation public.users does not exist"**, the database has no app tables yet. Run the **full** schema (see Option A below), not the small fix script.

If you only see **"user_integrations" missing**, the `user_integrations` table is missing. Apply the migrations:

1. **Option A – Supabase Dashboard**  
   - Open your project → **SQL Editor** → **New query**.  
   - Copy and run the contents of  
     `supabase/APPLY_FULL_SCHEMA.sql`  
     (it creates all tables including `public.users` and `user_integrations`).

2. **Option B – Supabase CLI**  
   - From the project root: `supabase db push`  
     (or `supabase migration up` if you use migrations).

Then try again. The auth callback (`/auth/callback`) also ensures a row in `public.users` exists for the signed-in user and, after Google OAuth, creates/updates `user_integrations` for `gmail`, `calendar`, and `drive` so Settings shows "Connected".

## 1. Environment variables

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – your Supabase anon key

## 2. Supabase redirect URL

The URL you use in the browser must match a **Redirect URL** in Supabase.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Under **Redirect URLs**, add the exact callback URL for your app, for example:
   - `http://localhost:3000/auth/callback` if you use port 3000
   - `http://localhost:3007/auth/callback` if you use port 3007 (or whatever port `npm run dev` prints)

Use the **same origin** (host + port) as in the browser bar when you click “Continue with Google”. If the redirect URL isn’t listed, Google will redirect back but Supabase will reject it and you’ll end up on sign-in again (sometimes with `?error=auth`).

## 3. Google provider in Supabase

1. In Supabase: **Authentication** → **Providers** → **Google**.
2. Enable Google and add:
   - **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/).
3. In Google Cloud Console, under **APIs & Services** → **Credentials** → your OAuth 2.0 Client:
   - Add **Authorized redirect URIs**:  
     `https://<your-project-ref>.supabase.co/auth/v1/callback`  
     (Supabase shows this in the Google provider setup.)

## 4. Quick checks

- **Nothing happens when you click “Continue with Google”**  
  The app must redirect to Google's OAuth URL. Check the browser console for errors (e.g. missing Supabase env vars). Ensure `.env.local` is loaded (restart `npm run dev` after changing it).

- **You come back to the sign-in page after choosing Google**  
  Usually the redirect URL (step 2) is wrong or missing. Add the exact `http://localhost:<port>/auth/callback` you’re using.

- **Error shown on sign-in page**  
  If the URL has `?error=auth`, the callback failed (often redirect URL). Otherwise the message may be from the server action (e.g. Supabase/Google config).
