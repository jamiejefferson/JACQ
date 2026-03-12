import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("telegram_bot_config")
    .select("bot_username")
    .eq("id", CONFIG_ID)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({ configured: true, username: data.bot_username });
}
