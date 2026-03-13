import { SupabaseClient } from "@supabase/supabase-js";
import { encryptApiKey, decryptApiKey } from "@/lib/llm-encrypt";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1";
const TASKS_BASE = "https://tasks.googleapis.com/tasks/v1";

/**
 * Get a valid Google access token for the given user and provider.
 * Automatically refreshes expired tokens. Returns null if not connected or revoked.
 */
export async function getGoogleAccessToken(
  supabase: SupabaseClient,
  userId: string,
  provider: "gmail" | "calendar" | "drive" = "calendar"
): Promise<string | null> {
  const { data: row } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, token_expiry, status")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (!row?.access_token || !row?.refresh_token) return null;
  if (row.status === "revoked") return null;

  // If token is still valid (>60s remaining), decrypt and return it
  if (row.token_expiry) {
    const expiresAt = new Date(row.token_expiry).getTime();
    if (expiresAt - Date.now() > 60_000) {
      return decryptApiKey(userId, row.access_token);
    }
  }

  // Token expired — refresh it
  const refreshToken = decryptApiKey(userId, row.refresh_token);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env vars");
    return null;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    // Token was likely revoked by the user
    const providers = ["gmail", "calendar", "drive"] as const;
    for (const p of providers) {
      await supabase
        .from("user_integrations")
        .update({ status: "revoked" })
        .eq("user_id", userId)
        .eq("provider", p);
    }
    return null;
  }

  const tokens = (await res.json()) as { access_token: string; expires_in: number };
  const newEncryptedAccess = encryptApiKey(userId, tokens.access_token);
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Update all three Google providers with the new access token
  const providers = ["gmail", "calendar", "drive"] as const;
  for (const p of providers) {
    await supabase
      .from("user_integrations")
      .update({ access_token: newEncryptedAccess, token_expiry: newExpiry })
      .eq("user_id", userId)
      .eq("provider", p);
  }

  return tokens.access_token;
}

/** Fetch from Google Calendar REST API */
export async function googleCalendarFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${CALENDAR_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/** Fetch from Gmail REST API */
export async function googleGmailFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${GMAIL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/** Fetch from Google Tasks REST API */
export async function googleTasksFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${TASKS_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/** Decode base64url-encoded string (used for Gmail message body parts) */
export function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}
