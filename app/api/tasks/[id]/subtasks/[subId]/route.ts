import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

async function checkTaskAccess(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, userId: string, taskId: string) {
  const { data } = await supabase.from("tasks").select("id").eq("id", taskId).eq("user_id", userId).single();
  return !!data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id, subId } = await params;
  const body = await request.json();
  const { supabase, user } = auth;

  const ok = await checkTaskAccess(supabase, user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.done !== undefined) {
    updates.done = body.done;
    updates.done_at = body.done ? new Date().toISOString() : null;
  }
  if (body.text !== undefined) updates.text = body.text;
  if (body.owner !== undefined) updates.owner = body.owner;

  const { data, error } = await supabase
    .from("task_subtasks")
    .update(updates)
    .eq("id", subId)
    .eq("task_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id, subId } = await params;
  const { supabase, user } = auth;

  const ok = await checkTaskAccess(supabase, user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("task_subtasks").delete().eq("id", subId).eq("task_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
