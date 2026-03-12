import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const { supabase, user } = auth;

  const { data: existing } = await supabase.from("users").select("preferences").eq("id", user.id).single();
  const preferences = { ...(existing?.preferences ?? {}), ...body };

  const { error } = await supabase.from("users").update({ preferences }).eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ preferences });
}
