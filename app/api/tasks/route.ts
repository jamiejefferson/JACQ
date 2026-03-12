import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let q = supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: body.title ?? "Untitled",
      status: body.status ?? "todo",
      tags: body.tags ?? [],
      working_note: body.working_note ?? null,
      source: body.source ?? null,
      source_ref: body.source_ref ?? null,
      due_at: body.due_at ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
