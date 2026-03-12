import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { supabase, user } = auth;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.source !== undefined) updates.source = body.source;
  if (body.value !== undefined) updates.value = body.value;
  if (body.label !== undefined) updates.label = body.label;

  const { data, error } = await supabase
    .from("understanding_entries")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { error } = await supabase
    .from("understanding_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
