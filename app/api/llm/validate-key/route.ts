import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";

type Provider = "anthropic" | "openai" | "google";

type AnthropicModel = { id: string; display_name: string };

async function fetchAnthropicModels(key: string): Promise<AnthropicModel[]> {
  const res = await fetch("https://api.anthropic.com/v1/models?limit=50", {
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
  });
  if (!res.ok) return [];
  const j = (await res.json().catch(() => ({}))) as { data?: Array<{ id?: string; display_name?: string }> };
  const data = j.data ?? [];
  return data
    .filter((m) => m.id && m.display_name)
    .map((m) => ({ id: m.id!, display_name: m.display_name! }));
}

async function validateAnthropic(key: string): Promise<{ valid: boolean; model?: string; models?: AnthropicModel[] }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });
  if (res.status === 401 || res.status === 403) return { valid: false };
  if (res.ok) {
    const models = await fetchAnthropicModels(key);
    return { valid: true, model: "claude-haiku-4-5", models };
  }
  const j = await res.json().catch(() => ({}));
  const model = j.model ?? "claude";
  return { valid: res.status < 500, model };
}

async function validateOpenAI(key: string): Promise<{ valid: boolean; model?: string }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 5,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });
  if (res.status === 401 || res.status === 403) return { valid: false };
  if (res.ok) return { valid: true, model: "gpt-4o-mini" };
  const j = await res.json().catch(() => ({}));
  return { valid: res.status < 500, model: j.model ?? "gpt" };
}

async function validateGoogle(key: string): Promise<{ valid: boolean; model?: string }> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
  if (res.status === 401 || res.status === 403) return { valid: false };
  if (res.ok) {
    const j = await res.json().catch(() => ({}));
    const model = j.models?.[0]?.name?.split("/").pop() ?? "gemini";
    return { valid: true, model };
  }
  return { valid: res.status < 500, model: "gemini" };
}

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const provider = (body.provider ?? "anthropic") as Provider;
  const key = typeof body.key === "string" ? body.key.trim() : "";

  if (!key) return NextResponse.json({ valid: false, error: "Key required" }, { status: 400 });

  let result: { valid: boolean; model?: string };
  switch (provider) {
    case "anthropic":
      result = await validateAnthropic(key);
      break;
    case "openai":
      result = await validateOpenAI(key);
      break;
    case "google":
      result = await validateGoogle(key);
      break;
    default:
      return NextResponse.json({ valid: false, error: "Unknown provider" }, { status: 400 });
  }

  return NextResponse.json(result);
}
