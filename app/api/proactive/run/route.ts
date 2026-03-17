import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWithinQuietHours } from "@/lib/proactivity";
import {
  getAllPendingTriggersForUser,
  markTriggerRun,
  storeInsightResult,
  seedDefaultTriggers,
} from "@/lib/insights";
import { runInsightTrigger, formatInsightForTelegram } from "@/lib/insight-runner";

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

  // Get all users (not just Telegram — web delivery too)
  const { data: users } = await supabase
    .from("users")
    .select("id, preferences");

  if (!users?.length) {
    return NextResponse.json({ ok: true, message: "No users" });
  }

  // Also get Telegram integrations for delivery
  const { data: telegramIntegrations } = await supabase
    .from("user_integrations")
    .select("user_id, telegram_chat_id")
    .eq("provider", "telegram")
    .eq("status", "active")
    .not("telegram_chat_id", "is", null);

  const telegramByUser = new Map<string, number>();
  for (const row of telegramIntegrations ?? []) {
    if (row.telegram_chat_id) {
      telegramByUser.set(row.user_id, Number(row.telegram_chat_id));
    }
  }

  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    const userId = user.id;
    const preferences = (user.preferences ?? {}) as Record<string, unknown>;
    const timezone = (preferences.timezone as string) || "Europe/London";

    // Seed default triggers if user has none
    await seedDefaultTriggers(supabase, userId, timezone);

    // Check quiet hours
    if (isWithinQuietHours(preferences, timezone)) continue;

    // Get all pending triggers (single daily run — fire everything not yet run today)
    const dueTriggers = await getAllPendingTriggersForUser(supabase, userId);
    if (dueTriggers.length === 0) continue;

    for (const trigger of dueTriggers) {
      try {
        console.log(`[proactive/run] Running trigger "${trigger.label}" for user ${userId}`);

        // Run the investigation
        const output = await runInsightTrigger(supabase, userId, trigger);

        // Determine delivery channels
        const channels = trigger.delivery_channels ?? ["telegram", "web"];
        const deliveredVia: string[] = [];

        // Telegram delivery
        if (channels.includes("telegram") && botToken) {
          const chatId = telegramByUser.get(userId);
          if (chatId) {
            const message = formatInsightForTelegram(trigger.label, output);
            await sendTelegramMessage(botToken, chatId, message);
            deliveredVia.push("telegram");
          }
        }

        // Web delivery = storing the result (web UI reads from insight_results)
        if (channels.includes("web")) {
          deliveredVia.push("web");
        }

        // Store the result
        await storeInsightResult(supabase, {
          user_id: userId,
          trigger_id: trigger.id,
          trigger_label: trigger.label,
          issues: output.issues,
          opportunities: output.opportunities,
          actions: output.actions,
          raw_text: output.raw_text,
          tools_used: output.tools_used,
          delivered_via: deliveredVia,
        });

        // Mark as run
        await markTriggerRun(supabase, trigger.id, trigger.schedule_type === "one_time");
        sent++;

        console.log(`[proactive/run] Completed "${trigger.label}" — ${output.issues.length} issues, ${output.opportunities.length} opportunities, ${output.actions.length} actions`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        console.error(`[proactive/run] Error running trigger "${trigger.label}":`, msg);
        errors.push(`${trigger.label}: ${msg}`);
      }
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
}
