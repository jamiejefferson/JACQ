import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { data: session, error: fetchError } = await supabase
    .from("chat_sessions")
    .select("id, messages, summary")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = (session.messages ?? []) as Array<{ role: string; content: string }>;
  if (messages.length <= 20) {
    return NextResponse.json({ ok: true, message: "No compression needed" });
  }

  const kept = messages.slice(-20);
  const { error: updateError } = await supabase
    .from("chat_sessions")
    .update({
      messages: kept,
      summary: (session.summary as string) || "Earlier messages compressed.",
      last_message_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
