import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

async function checkTaskAccess(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, userId: string, taskId: string) {
  const { data } = await supabase.from("tasks").select("id").eq("id", taskId).eq("user_id", userId).single();
  return !!data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const ok = await checkTaskAccess(supabase, user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("task_people")
    .select("*, contacts(*)")
    .eq("task_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const { supabase, user } = auth;

  const ok = await checkTaskAccess(supabase, user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("task_people")
    .insert({ task_id: id, contact_id: body.contact_id ?? null, role: body.role ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
