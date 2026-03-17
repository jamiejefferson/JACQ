import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

/**
 * Connect Granola for the current user.
 * Creates or updates user_integrations with provider 'granola', status 'active'.
 * Later this can be extended to OAuth or API key flow; for now we persist the connection state.
 */
export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { error } = await supabase.from("user_integrations").upsert(
    {
      user_id: user.id,
      provider: "granola",
      status: "active",
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
