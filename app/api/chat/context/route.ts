import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { assembleContext } from "@/lib/context";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const pkg = await assembleContext(supabase, user.id);

  return NextResponse.json(pkg);
}
