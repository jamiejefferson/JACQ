import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, session_type, channel, summary, started_at, last_message_at, status")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ sessions: data ?? [] });
}
