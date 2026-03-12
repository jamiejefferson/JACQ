import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

async function checkContactAccess(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  contactId: string
) {
  const { data } = await supabase.from("contacts").select("id").eq("id", contactId).eq("user_id", userId).single();
  return !!data;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id, itemId } = await params;
  const { supabase, user } = auth;

  const ok = await checkContactAccess(supabase, user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("contact_open_items")
    .delete()
    .eq("id", itemId)
    .eq("contact_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
