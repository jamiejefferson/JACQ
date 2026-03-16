import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { count, error } = await supabase
    .from("insight_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "unread");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ count: count ?? 0 });
}
