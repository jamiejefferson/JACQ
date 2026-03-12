import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string; email?: string } }
  | { response: NextResponse };

export async function getSupabaseAndUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    supabase,
    user: { id: user.id, email: user.email ?? undefined },
  };
}
