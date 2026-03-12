import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { randomInt } from "crypto";

const EXPIRES_IN_SECONDS = 300;

export async function POST() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const code = randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + EXPIRES_IN_SECONDS * 1000).toISOString();

  const { error } = await supabase.from("telegram_codes").upsert(
    { user_id: user.id, code, expires_at: expiresAt },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code, expiresIn: EXPIRES_IN_SECONDS });
}
