import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("activity_log")
    .update({ status: "done", approved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
