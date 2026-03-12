import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("weekly_learning_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? null);
}
