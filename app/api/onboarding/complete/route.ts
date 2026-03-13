import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data: userRow } = await supabase.from("users").select("preferences").eq("id", user.id).single();
  const preferences = { ...(userRow?.preferences ?? {}) } as Record<string, unknown>;
  preferences.onboarding_phase = "complete";

  const { error: updateError } = await supabase
    .from("users")
    .update({ onboarding_complete: true, preferences })
    .eq("id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await supabase.auth.updateUser({ data: { onboarding_complete: true } });

  const body = await request.json().catch(() => ({}));
  const nextPath = typeof body.redirectTo === "string" ? body.redirectTo : "/app/home";
  return NextResponse.json({ ok: true, redirectTo: nextPath });
}
