import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const period = searchParams.get("period");

  let q = supabase.from("commitments").select("*").eq("user_id", user.id).order("due_at", { ascending: true, nullsFirst: false });

  if (status === "active") {
    q = q.in("status", ["pending", "in_progress"]);
  } else if (status === "completed" && period === "week") {
    q = q.eq("status", "completed");
    const start = new Date();
    start.setDate(start.getDate() - 7);
    q = q.gte("completed_at", start.toISOString());
  } else if (status) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("commitments")
    .insert({
      user_id: user.id,
      description: body.description ?? "",
      due_at: body.due_at ?? null,
      status: body.status ?? "pending",
      source_type: body.source_type ?? null,
      source_ref: body.source_ref ?? null,
      source_label: body.source_label ?? null,
      task_id: body.task_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
