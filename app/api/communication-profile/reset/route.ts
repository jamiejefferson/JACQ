import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

/** Reset communication profile to defaults (delete row; next read will return empty/defaults). */
export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  await supabase.from("communication_profiles").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
