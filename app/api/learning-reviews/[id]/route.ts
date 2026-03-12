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
  if (body.status === "completed") updates.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("weekly_learning_reviews")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
