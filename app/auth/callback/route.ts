import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptApiKey } from "@/lib/llm-encrypt";
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
    const authUser = data.session.user;
    const metadata = authUser.user_metadata as Record<string, unknown>;

    // Use service role to read/write users so we never fail due to RLS and never overwrite onboarding_complete by mistake
    let admin: ReturnType<typeof createAdminClient> | null = null;
    try {
      admin = createAdminClient();
    } catch {
      // No admin client (e.g. missing env); fall back to session client below
    }

    const { data: existingRow } = admin
      ? await admin.from("users").select("id, onboarding_complete").eq("id", userId).maybeSingle()
      : { data: null as { id: string; onboarding_complete: boolean } | null };

    if (!existingRow && admin) {
      await admin.from("users").upsert(
        {
          id: userId,
          email: authUser.email ?? null,
          name: (metadata?.full_name as string) ?? (metadata?.name as string) ?? null,
          onboarding_complete: (metadata?.onboarding_complete as boolean) ?? false,
          preferences: (metadata?.preferences as object) ?? {},
        },
        { onConflict: "id" }
      );
    } else if (!existingRow && !admin) {
      const { data: sessionRow } = await supabase.from("users").select("id").eq("id", userId).single();
      if (!sessionRow) {
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
    }

    // Capture Google provider tokens for API access
    const providerToken = data.session.provider_token;
    const providerRefreshToken = data.session.provider_refresh_token;

    const encryptedAccess = providerToken ? encryptApiKey(userId, providerToken) : null;
    const encryptedRefresh = providerRefreshToken ? encryptApiKey(userId, providerRefreshToken) : null;
    const tokenExpiry = providerToken
      ? new Date(Date.now() + 3500 * 1000).toISOString()
      : null;

    const now = new Date().toISOString();
    for (const provider of GOOGLE_INTEGRATION_PROVIDERS) {
      await supabase.from("user_integrations").upsert(
        {
          user_id: userId,
          provider,
          status: "active",
          connected_at: now,
          ...(encryptedAccess && { access_token: encryptedAccess }),
          ...(encryptedRefresh && { refresh_token: encryptedRefresh }),
          ...(tokenExpiry && { token_expiry: tokenExpiry }),
        },
        { onConflict: "user_id,provider" }
      );
    }

    // Redirect to /app if onboarding already complete (source of truth: DB via admin, or metadata fallback)
    let completed =
      (existingRow?.onboarding_complete === true) ||
      (metadata?.onboarding_complete === true);

    // For returning users whose onboarding_complete was never persisted to DB,
    // check if they have any understanding entries (proof they used the app)
    if (!completed && existingRow) {
      const client = admin ?? supabase;
      const { count } = await client
        .from("understanding_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .limit(1);
      if (count && count > 0) {
        completed = true;
      }
    }

    if (completed) {
      if (admin && existingRow?.onboarding_complete !== true) {
        await admin.from("users").update({ onboarding_complete: true }).eq("id", userId);
      }
      await supabase.auth.updateUser({ data: { onboarding_complete: true } });
      return NextResponse.redirect(`${origin}/app/home`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
