import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

const UNDO_WINDOW_MS = 30 * 60 * 1000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { data: row } = await supabase
    .from("activity_log")
    .select("created_at, is_undoable")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const created = new Date(row.created_at).getTime();
  if (Date.now() - created > UNDO_WINDOW_MS || !row.is_undoable) {
    return NextResponse.json({ error: "Undo not available" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("activity_log")
    .update({ status: "undone", undone_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
