import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { encryptApiKey } from "@/lib/llm-encrypt";

export type LLMConfig = {
  provider: "jacq" | "anthropic" | "openai" | "google" | "local";
  model?: string;
  api_key_ref?: string;
  local_endpoint?: string;
  fallback_to_jacq: boolean;
};

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { data, error } = await supabase.from("users").select("preferences").eq("id", user.id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const prefs = data?.preferences ?? {};
  const llm_config: LLMConfig = prefs.llm_config ?? {
    provider: "jacq",
    fallback_to_jacq: true,
  };

  return NextResponse.json(llm_config);
}

export async function PATCH(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const { supabase, user } = auth;

  const { data: existing } = await supabase.from("users").select("preferences").eq("id", user.id).single();

  if (!existing) {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    await supabase.from("users").upsert(
      {
        id: user.id,
        email: authUser?.email ?? null,
        name: (authUser?.user_metadata as { full_name?: string; name?: string })?.full_name ?? (authUser?.user_metadata as { full_name?: string; name?: string })?.name ?? null,
        onboarding_complete: (authUser?.user_metadata as { onboarding_complete?: boolean })?.onboarding_complete ?? false,
        preferences: (authUser?.user_metadata as { preferences?: object })?.preferences ?? {},
      },
      { onConflict: "id" }
    );
  }

  const preferences = { ...(existing?.preferences ?? {}) };

  const llm_config: LLMConfig = {
    ...(preferences.llm_config ?? { provider: "jacq", fallback_to_jacq: true }),
    ...body,
  };

  if (body.api_key != null && typeof body.api_key === "string" && body.api_key.trim()) {
    const encrypted = encryptApiKey(user.id, body.api_key.trim());
    const { data: integration, error: upsertError } = await supabase
      .from("user_integrations")
      .upsert(
        {
          user_id: user.id,
          provider: "llm_key",
          secret_encrypted: encrypted,
          status: "active",
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      )
      .select("id")
      .single();

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
    llm_config.api_key_ref = integration?.id;
  }

  delete (llm_config as Record<string, unknown>).api_key;
  preferences.llm_config = llm_config;

  const { error: updateError } = await supabase.from("users").update({ preferences }).eq("id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json(llm_config);
}
