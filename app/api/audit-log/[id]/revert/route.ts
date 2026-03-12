import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split(".");
  const out = JSON.parse(JSON.stringify(obj));
  let cur: Record<string, unknown> = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!(key in cur) || typeof cur[key] !== "object") cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return out;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { data: logRow, error: fetchError } = await supabase
    .from("settings_audit_log")
    .select("id, path, old_value, new_value")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !logRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: userRow } = await supabase.from("users").select("preferences").eq("id", user.id).single();
  const preferences = (userRow?.preferences ?? {}) as Record<string, unknown>;
  const reverted = setByPath(preferences, logRow.path, logRow.old_value);

  const { error: updateError } = await supabase.from("users").update({ preferences: reverted }).eq("id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await supabase.from("settings_audit_log").insert({
    user_id: user.id,
    path: logRow.path,
    old_value: logRow.new_value,
    new_value: logRow.old_value,
    reason: "Reverted by user",
    changed_by: "user",
  });

  return NextResponse.json({ ok: true, preferences: reverted });
}
