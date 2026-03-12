import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { data: row } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!row) {
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
    const { data: inserted } = await supabase.from("users").select("*").eq("id", user.id).single();
    return NextResponse.json(inserted ?? { id: user.id, email: user.email, preferences: {} });
  }

  return NextResponse.json(row);
}

export async function DELETE() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  await supabase.from("users").delete().eq("id", user.id);
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
