# Telegram bot setup (deployer only)

This is one-time setup for whoever deploys the app. End users never see or set a bot token.

## 1. Create the bot

1. In Telegram, open [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts (name and username, e.g. `JACQ Bot` and `JACQ007_bot`).
3. BotFather returns a **token** (e.g. `123456789:ABCdef...`). Keep it secret.
4. Note the bot **username** (the part after `t.me/`, e.g. `JACQ007_bot`).

## 2. Set environment variables

In your **deployment** environment (e.g. Vercel project env, or server `.env`), set:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Secret token from BotFather. Server-only; never exposed to the browser. | `123456789:ABCdef...` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username (no `@`). Used to build the one-tap connect link. | `JACQ007_bot` |

The webhook handler needs Supabase to link users. Ensure these are set in the same environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (so the webhook can write to `user_integrations` and read/delete `telegram_link_tokens`; it does not use the anon key).

## 3. Register the webhook (one time)

After deployment, tell Telegram where to send updates. The webhook URL must be **HTTPS** and publicly reachable.

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook"
```

Replace:

- `<YOUR_TELEGRAM_BOT_TOKEN>` with your actual bot token.
- `your-domain.com` with your app’s public host (e.g. `myapp.vercel.app`).

To clear the webhook later (e.g. for debugging):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/deleteWebhook"
```

## 4. User flow (no deployer action)

Users go to **Settings → Integrations**, tap **Connect** next to Telegram, then **Open Telegram**. In the chat they tap **Start** and are linked. No codes, no env, no token handling by end users.

If the bot or webhook is not configured, the Connect modal shows: “Telegram isn’t set up for this app yet. Ask your administrator.”
