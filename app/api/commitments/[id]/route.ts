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

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.description !== undefined) updates.description = body.description;
  if (body.due_at !== undefined) updates.due_at = body.due_at;
  if (body.completed_at !== undefined) updates.completed_at = body.completed_at;
  if (body.missed_reason !== undefined) updates.missed_reason = body.missed_reason;

  const { data, error } = await supabase
    .from("commitments")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
