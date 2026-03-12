import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}
