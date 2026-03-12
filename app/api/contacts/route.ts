import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("is_vip", { ascending: true })
    .order("last_contact_at", { ascending: false, nullsFirst: false })
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const vip = (data ?? []).filter((c) => c.is_vip);
  const others = (data ?? []).filter((c) => !c.is_vip);
  return NextResponse.json({ contacts: data ?? [], vip, others });
}

export async function POST(request: Request) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const { supabase, user } = auth;

  const name = body.name ?? "";
  const initials = name
    .split(/\s+/)
    .map((s: string) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name,
      role: body.role ?? null,
      organisation: body.organisation ?? null,
      email: body.email ?? null,
      is_vip: body.is_vip ?? false,
      initials: body.initials ?? initials,
      colour: body.colour ?? null,
      jacq_context: body.jacq_context ?? null,
      communication_preferences: body.communication_preferences ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
