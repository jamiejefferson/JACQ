import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptApiKey } from "./llm-encrypt";
import { EXTRACTION_TOOLS } from "./llm-tools";

export type LLMResolvedConfig = {
  provider: string;
  model: string;
  apiKey: string;
};

export async function resolveLLMConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<LLMResolvedConfig | null> {
  const { data: userRow } = await supabase.from("users").select("preferences").eq("id", userId).single();
  const prefs = (userRow?.preferences ?? {}) as Record<string, unknown>;
  const llm = (prefs.llm_config ?? { provider: "jacq", fallback_to_jacq: true }) as {
    provider?: string;
    model?: string;
    api_key_ref?: string;
    fallback_to_jacq?: boolean;
  };

  const provider = llm.provider === "anthropic" || llm.provider === "openai" || llm.provider === "google" ? llm.provider : "anthropic";
  const model = (llm.model as string) || (provider === "anthropic" ? "claude-haiku-4-5" : provider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash");

  if (llm.provider === "jacq" || (!llm.api_key_ref && llm.fallback_to_jacq !== false)) {
    const jacqKey = process.env.ANTHROPIC_API_KEY;
    if (jacqKey) return { provider: "anthropic", model: "claude-haiku-4-5", apiKey: jacqKey };
  }

  if (llm.api_key_ref) {
    const { data: integration } = await supabase
      .from("user_integrations")
      .select("secret_encrypted")
      .eq("id", llm.api_key_ref)
      .eq("user_id", userId)
      .single();
    const encrypted = integration?.secret_encrypted;
    if (encrypted) {
      try {
        const apiKey = decryptApiKey(userId, encrypted);
        return { provider: provider as "anthropic" | "openai" | "google", model, apiKey };
      } catch {
        return null;
      }
    }
  }

  return null;
}

/** Anthropic tool format for Messages API */
function anthropicTools() {
  return EXTRACTION_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}

export type ToolCall = { id: string; name: string; input: Record<string, unknown> };

export type LLMResponse = {
  content: string;
  toolCalls: ToolCall[];
  usage?: { prompt_tokens: number; completion_tokens: number };
};

type ToolDef = { name: string; description: string; input_schema: Record<string, unknown> };

/** Call Anthropic Messages API with tools; returns content and tool_use blocks. */
export async function completeWithTools(
  config: LLMResolvedConfig,
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  tools: ToolDef[] = anthropicTools()
): Promise<LLMResponse> {
  if (config.provider !== "anthropic") {
    return { content: "Only Anthropic is supported for tool calls in this build.", toolCalls: [] };
  }

  const apiMessages = messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const body = {
    model: config.model,
    max_tokens: 4096,
    system,
    messages: apiMessages,
    tools: tools.length ? tools : undefined,
  };

  const start = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  let content = "";
  const toolCalls: ToolCall[] = [];

  for (const block of data.content ?? []) {
    if (block.type === "text" && block.text) content += block.text;
    if (block.type === "tool_use" && block.id && block.name) {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: (block.input ?? {}) as Record<string, unknown>,
      });
    }
  }

  const usage = data.usage
    ? { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens }
    : undefined;

  return { content, toolCalls, usage };
}
