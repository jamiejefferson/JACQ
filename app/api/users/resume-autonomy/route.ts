import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { data: existing } = await supabase.from("users").select("preferences").eq("id", user.id).single();
  const preferences = { ...(existing?.preferences ?? {}), autonomy_paused: false };

  await supabase.from("users").update({ preferences }).eq("id", user.id);
  return NextResponse.json({ ok: true });
}
