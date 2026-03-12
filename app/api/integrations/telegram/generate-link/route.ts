import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

const EXPIRES_IN_MS = 10 * 60 * 1000; // 10 minutes
const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  let username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim();
  if (!username) {
    const admin = createAdminClient();
    const { data } = await admin.from("telegram_bot_config").select("bot_username").eq("id", CONFIG_ID).maybeSingle();
    username = data?.bot_username ?? null;
  }
  if (!username) {
    return NextResponse.json(
      { error: "Telegram not configured. Set up your bot first (paste token in Settings)." },
      { status: 503 }
    );
  }

  const { supabase, user } = auth;
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRES_IN_MS).toISOString();

  const { error } = await supabase.from("telegram_link_tokens").insert({
    token,
    user_id: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const link = `https://t.me/${username}?start=${token}`;
  return NextResponse.json({ link });
}
