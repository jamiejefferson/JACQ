import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { supabase, user } = auth;

  const { data: contact } = await supabase
    .from("contacts")
    .select("response_rate, meeting_frequency, last_contact_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lastContact = contact.last_contact_at
    ? formatLastContact(new Date(contact.last_contact_at))
    : "Never";

  return NextResponse.json({
    response_rate: contact.response_rate ?? "Normal (1-4hr)",
    meeting_frequency: contact.meeting_frequency ?? "Occasional",
    last_contact: lastContact,
  });
}

function formatLastContact(d: Date): string {
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
}
