import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { error } = await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "granola");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
