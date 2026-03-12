import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const code = (body.code as string | undefined)?.trim();
  const { supabase, user } = auth;

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("telegram_codes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("code", code)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const { error: deleteError } = await supabase.from("telegram_codes").delete().eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.from("user_integrations").upsert(
    {
      user_id: user.id,
      provider: "telegram",
      status: "active",
      telegram_chat_id: null,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.json({ ok: true });
}
