"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(origin: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) return { error: error.message };
  return { url: data.url };
}
