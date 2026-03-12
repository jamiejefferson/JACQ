import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

/** Proxies check for local desktop app (localhost:39871). */
export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;
  const base = process.env.LLM_LOCAL_ENDPOINT || "http://127.0.0.1:39871";
  try {
    const res = await fetch(`${base}/status`, { signal: AbortSignal.timeout(3000) });
    return NextResponse.json({ connected: res.ok });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
