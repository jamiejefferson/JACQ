import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

/** Set onboarding_phase to 'partial' (user chose "Done for now" in conversation). */
export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data: userRow } = await supabase.from("users").select("preferences").eq("id", user.id).single();
  const preferences = { ...(userRow?.preferences ?? {}) } as Record<string, unknown>;
  preferences.onboarding_phase = "partial";

  const { error } = await supabase.from("users").update({ preferences }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
