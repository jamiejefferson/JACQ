import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("insight_triggers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ triggers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const body = await request.json();

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!label || !prompt) {
    return NextResponse.json({ error: "label and prompt are required" }, { status: 400 });
  }

  const scheduleType = body.schedule_type === "recurring" ? "recurring" : "one_time";

  // Get user timezone
  const { data: userRow } = await supabase.from("users").select("preferences").eq("id", user.id).single();
  const tz = ((userRow?.preferences as Record<string, unknown>)?.timezone as string) || "Europe/London";

  const { data, error } = await supabase
    .from("insight_triggers")
    .insert({
      user_id: user.id,
      label,
      prompt,
      schedule_type: scheduleType,
      cron_expression: typeof body.cron_expression === "string" ? body.cron_expression : null,
      run_at: typeof body.run_at === "string" ? body.run_at : null,
      timezone: tz,
      delivery_channels: Array.isArray(body.delivery_channels) ? body.delivery_channels : ["telegram", "web"],
      enabled: true,
      is_system_default: false,
      created_by: "user",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ trigger: data });
}
