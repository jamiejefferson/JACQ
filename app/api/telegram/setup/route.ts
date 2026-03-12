import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

type GetMeResult = { ok: true; result: { username: string } } | { ok: false; description?: string };

export async function POST(request: Request) {
  try {
    const auth = await getSupabaseAndUser();
    if ("response" in auth) return auth.response;

    let body: { token?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate token and get bot username via Telegram API
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const getMeData = (await getMeRes.json()) as GetMeResult;

    if (!getMeData.ok || !getMeData.result?.username) {
      return NextResponse.json(
        { error: "Invalid token. Check the token from BotFather and try again." },
        { status: 400 }
      );
    }

    const botUsername = getMeData.result.username;

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      return NextResponse.json(
        { error: "Server configuration missing. Add SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to your environment." },
        { status: 500 }
      );
    }

    const { error: upsertError } = await supabase.from("telegram_bot_config").upsert(
      {
        id: CONFIG_ID,
        bot_token: token,
        bot_username: botUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      const msg = upsertError.message;
      const hint = msg.includes("does not exist") ? " Run the database migration for telegram_bot_config (see supabase/migrations)." : "";
      return NextResponse.json({ error: msg + hint }, { status: 500 });
    }

    // Set webhook if we have a public base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

    if (baseUrl) {
      const webhookUrl = `${baseUrl}/api/telegram/webhook`;
      await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
    }

    return NextResponse.json({ success: true, username: botUsername });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save Telegram token." },
      { status: 500 }
    );
  }
}
