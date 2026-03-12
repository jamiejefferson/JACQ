import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("communication_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? {});
}

export async function PATCH(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const { supabase, user } = auth;

  const { data: existing } = await supabase
    .from("communication_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const allowed = [
    "writing_tone", "writing_formality", "writing_length", "writing_signature",
    "preferred_greeting", "proactivity_level", "proactivity_timing", "briefing_depth",
    "preferred_update_channel", "update_frequency", "user_reply_style", "user_emoji_usage",
    "user_punctuation_style", "short_reply_means", "silence_means", "decision_style",
    "feedback_preference", "how_to_disagree", "language", "idiom_style",
  ];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Array.isArray(body.phrases_to_use)) update.phrases_to_use = body.phrases_to_use;
  if (Array.isArray(body.phrases_to_avoid)) update.phrases_to_avoid = body.phrases_to_avoid;
  if (Array.isArray(body.sensitivity_areas)) update.sensitivity_areas = body.sensitivity_areas;

  if (existing) {
    const { data, error } = await supabase
      .from("communication_profiles")
      .update(update)
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("communication_profiles")
    .insert({ user_id: user.id, ...update })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
