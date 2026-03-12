import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GOOGLE_INTEGRATION_PROVIDERS = ["gmail", "calendar", "drive"] as const;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const userId = data.session?.user?.id;
  if (userId) {
    const { data: existing } = await supabase.from("users").select("id").eq("id", userId).single();
    if (!existing) {
      const authUser = data.session.user;
      const metadata = authUser.user_metadata as Record<string, unknown>;
      await supabase.from("users").upsert(
        {
          id: userId,
          email: authUser.email ?? null,
          name: (metadata?.full_name as string) ?? (metadata?.name as string) ?? null,
          onboarding_complete: (metadata?.onboarding_complete as boolean) ?? false,
          preferences: (metadata?.preferences as object) ?? {},
        },
        { onConflict: "id" }
      );
    }

    const now = new Date().toISOString();
    for (const provider of GOOGLE_INTEGRATION_PROVIDERS) {
      await supabase.from("user_integrations").upsert(
        {
          user_id: userId,
          provider,
          status: "active",
          connected_at: now,
        },
        { onConflict: "user_id,provider" }
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
