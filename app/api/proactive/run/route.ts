import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assembleContext } from "@/lib/context";
import {
  getProactivityChecks,
  getSlotsDue,
  getTodayInZone,
  getProactivityLastRun,
  setProactivityLastRun,
  buildProactiveMessage,
  generateProactiveCheckIn,
  isWithinQuietHours,
} from "@/lib/proactivity";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

async function getBotToken(supabase: ReturnType<typeof createAdminClient>): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  const { data } = await supabase
    .from("telegram_bot_config")
    .select("bot_token")
    .eq("id", CONFIG_ID)
    .maybeSingle();
  return data?.bot_token ?? null;
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const botToken = await getBotToken(supabase);
  if (!botToken) {
    return NextResponse.json({ error: "Telegram bot not configured" }, { status: 503 });
  }

  const { data: integrations } = await supabase
    .from("user_integrations")
    .select("user_id, telegram_chat_id")
    .eq("provider", "telegram")
    .eq("status", "active")
    .not("telegram_chat_id", "is", null);

  if (!integrations?.length) {
    return NextResponse.json({ ok: true, message: "No users with Telegram connected" });
  }

  let sent = 0;
  for (const row of integrations) {
    const userId = row.user_id;
    const chatId = Number(row.telegram_chat_id);
    if (!chatId) continue;

    const { data: userRow } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", userId)
      .single();

    const preferences = (userRow?.preferences ?? {}) as Record<string, unknown>;
    const timezone = (preferences.timezone as string) || "UTC";
    const checks = getProactivityChecks(preferences);
    const dueSlots = getSlotsDue(checks, timezone);
    if (dueSlots.length === 0) continue;

    if (isWithinQuietHours(preferences, timezone)) continue;

    const today = getTodayInZone(timezone);
    const lastRun = getProactivityLastRun(preferences);
    let preferencesUpdated = false;
    let newPrefs = { ...preferences };

    for (const slotId of dueSlots) {
      if (lastRun[slotId] === today) continue;

      const pkg = await assembleContext(supabase, userId);
      const message =
        (await generateProactiveCheckIn(supabase, userId, pkg, slotId)) ??
        buildProactiveMessage(pkg, slotId);
      await sendTelegramMessage(botToken, chatId, message);
      newPrefs = setProactivityLastRun(newPrefs, slotId, today) as Record<string, unknown>;
      preferencesUpdated = true;
      sent++;
    }

    if (preferencesUpdated) {
      await supabase.from("users").update({ preferences: newPrefs }).eq("id", userId);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
