import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Register the Telegram webhook so Telegram can send updates when users tap Start.
 * Uses the request origin (e.g. from ngrok) so local dev works without env.
 */
export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const { data: config, error: configError } = await supabase
    .from("telegram_bot_config")
    .select("bot_token")
    .eq("id", CONFIG_ID)
    .maybeSingle();

  if (configError || !config?.bot_token) {
    return NextResponse.json({ error: "Telegram bot not set up. Save your token first." }, { status: 400 });
  }

  // Prefer base URL from request so visiting via ngrok works
  const origin = request.headers.get("origin") || request.headers.get("referer");
  const baseUrl =
    (origin ? new URL(origin).origin : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!baseUrl || baseUrl.includes("localhost")) {
    return NextResponse.json(
      { error: "Use a public URL (e.g. open this app via ngrok) so Telegram can reach the webhook." },
      { status: 400 }
    );
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${config.bot_token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const data = (await res.json()) as { ok?: boolean; description?: string };

  if (!data.ok) {
    return NextResponse.json({ error: data.description ?? "Failed to set webhook" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, webhookUrl });
}
