import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id: number };
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelegramUpdate;
    const text = body.message?.text?.trim();
    const chatId = body.message?.chat?.id;

    if (!text?.startsWith("/start") || chatId == null) {
      return NextResponse.json({ ok: true });
    }

    const linkToken = text.slice(6).trim(); // "/start" or "/start TOKEN"
    if (!linkToken) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();
    const { data: row, error: fetchError } = await supabase
      .from("telegram_link_tokens")
      .select("user_id")
      .eq("token", linkToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ ok: true });
    }

    await supabase.from("telegram_link_tokens").delete().eq("token", linkToken);

    await supabase.from("user_integrations").upsert(
      {
        user_id: row.user_id,
        provider: "telegram",
        status: "active",
        telegram_chat_id: String(chatId),
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      const { data: config } = await supabase.from("telegram_bot_config").select("bot_token").eq("id", CONFIG_ID).maybeSingle();
      botToken = config?.bot_token ?? null;
    }
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "You're connected to Jacq!",
        }),
      });
    }
  } catch {
    // Return 200 so Telegram does not retry
  }
  return NextResponse.json({ ok: true });
}
