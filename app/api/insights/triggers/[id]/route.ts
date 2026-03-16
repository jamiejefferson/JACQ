import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { id } = await params;
  const body = await request.json();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  if (typeof body.label === "string") update.label = body.label;
  if (typeof body.prompt === "string") update.prompt = body.prompt;
  if (typeof body.cron_expression === "string") update.cron_expression = body.cron_expression;
  if (typeof body.run_at === "string") update.run_at = body.run_at;
  if (Array.isArray(body.delivery_channels)) update.delivery_channels = body.delivery_channels;

  const { error } = await supabase
    .from("insight_triggers")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("insight_triggers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
