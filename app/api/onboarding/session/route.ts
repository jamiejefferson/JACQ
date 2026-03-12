import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id, messages, summary")
    .eq("user_id", user.id)
    .eq("session_type", "onboarding")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      sessionId: existing.id,
      messages: (existing.messages ?? []) as Array<{ role: string; content: string }>,
    });
  }

  const { data: created, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      session_type: "onboarding",
      channel: "web",
      messages: [],
      status: "active",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    sessionId: created?.id,
    messages: [],
  });
}
