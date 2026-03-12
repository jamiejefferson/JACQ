import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

async function checkTaskAccess(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, userId: string, taskId: string) {
  const { data } = await supabase.from("tasks").select("id").eq("id", taskId).eq("user_id", userId).single();
  return !!data;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id, contactId } = await params;
  const { supabase, user } = auth;

  const ok = await checkTaskAccess(supabase, user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("task_people")
    .delete()
    .eq("task_id", id)
    .eq("contact_id", contactId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
