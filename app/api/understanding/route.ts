import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const section = searchParams.get("section");

  let q = supabase.from("understanding_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
  if (source) q = q.eq("source", source);
  if (section) q = q.eq("section", section);

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const bySection: Record<string, typeof data> = {};
  const sectionOrder = ["about_me", "communication", "calendar_time", "working_style"];
  for (const s of sectionOrder) bySection[s] = [];
  for (const row of data ?? []) {
    const s = row.section ?? "about_me";
    if (!bySection[s]) bySection[s] = [];
    bySection[s].push(row);
  }

  return NextResponse.json({ entries: data, bySection });
}

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("understanding_entries")
    .insert({
      user_id: user.id,
      section: body.section ?? "about_me",
      label: body.label ?? "",
      value: body.value ?? "",
      source: body.source ?? "told",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const entries = Array.isArray(body.entries) ? body.entries : [];
  const { supabase, user } = auth;

  const results: unknown[] = [];
  for (const e of entries) {
    const section = (e.section ?? "about_me") as string;
    const label = String(e.label ?? "").trim();
    const value = String(e.value ?? "").trim();
    const source = (e.source ?? "told") as string;
    if (!label || !value) continue;
    const { data: existing } = await supabase
      .from("understanding_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("label", label)
      .maybeSingle();
    if (existing) {
      const { data, error } = await supabase
        .from("understanding_entries")
        .update({ value, source, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (!error) results.push(data);
    } else {
      const { data, error } = await supabase
        .from("understanding_entries")
        .insert({ user_id: user.id, section, label, value, source })
        .select()
        .single();
      if (!error) results.push(data);
    }
  }
  return NextResponse.json({ entries: results });
}
