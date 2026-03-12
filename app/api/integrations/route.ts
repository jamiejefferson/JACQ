import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_integrations")
    .select("provider, status, connected_at")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const byProvider: Record<string, { status: string; connected_at: string | null }> = {};
  for (const row of data ?? []) {
    byProvider[row.provider] = { status: row.status, connected_at: row.connected_at };
  }
  return NextResponse.json({ integrations: byProvider });
}
