import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { assembleContext, formatContextBlock } from "@/lib/context";
import { resolveLLMConfig, completeWithTools, completeWithToolsRaw } from "@/lib/llm-client";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { executeTool } from "@/lib/tool-execution";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const messages = (body.messages ?? []) as Array<{ role: string; content: string }>;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

  const { supabase, user } = auth;

  const config = await resolveLLMConfig(supabase, user.id);
  if (!config) {
    return NextResponse.json(
      { error: "LLM not configured. Set up your AI in onboarding or settings." },
      { status: 400 }
    );
  }

  let sid = sessionId;
  if (!sid) {
    const { data: newSession, error: createError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        session_type: "in_app",
        channel: "web",
        messages: [],
        status: "active",
      })
      .select("id")
      .single();
    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });
    sid = newSession?.id ?? null;
  } else {
    const { data: existing } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sid)
      .eq("user_id", user.id)
      .single();
    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const pkg = await assembleContext(supabase, user.id);
  const contextBlock = formatContextBlock(pkg);
  const system = buildSystemPrompt(contextBlock, "web");

  const apiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: typeof m.content === "string" ? m.content : "",
  }));

  const start = Date.now();
  let usage: { prompt_tokens?: number; completion_tokens?: number } = {};
  let content = "";
  let toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

  try {
    const result = await completeWithTools(config, system, apiMessages);
    content = result.content;
    toolCalls = result.toolCalls;
    usage = result.usage ?? {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const latencyMs = Date.now() - start;

  const toolsCalled: string[] = [];
  const toolResults: Array<{ type: string; tool: string; label?: string; section?: string; ok?: boolean; reason?: string }> = [];

  // Loop up to 3 rounds of tool calls
  let currentToolCalls = toolCalls;
  let rawMessages: Array<{ role: "user" | "assistant"; content: unknown }> = apiMessages.map((m) => ({
    role: m.role,
    content: m.content as unknown,
  }));
  const MAX_TOOL_ROUNDS = 3;

  for (let round = 0; round < MAX_TOOL_ROUNDS && currentToolCalls.length > 0; round++) {
    const roundResults: Array<{ id: string; name: string; input: Record<string, unknown>; resultText: string }> = [];
    let hasDataResults = false;

    for (const tc of currentToolCalls) {
      toolsCalled.push(tc.name);
      const result = await executeTool(supabase, user.id, sid, tc.name, tc.input);

      const resultText = result.ok
        ? (result.data ?? `Done: ${tc.name}`)
        : `Failed: ${result.reason ?? "unknown error"}`;
      roundResults.push({ id: tc.id, name: tc.name, input: tc.input, resultText });

      if (result.ok && result.data) hasDataResults = true;

      if (result.ok && result.tool === "extract_understanding") {
        toolResults.push({
          type: "tool_result",
          tool: result.tool,
          label: result.label,
          section: result.section,
        });
      } else if (result.ok) {
        toolResults.push({ type: "tool_result", tool: result.tool });
      } else {
        toolResults.push({ type: "tool_result", tool: result.tool, ok: false, reason: result.reason ?? "Tool failed" });
      }
    }

    // Build follow-up messages with tool use + results
    rawMessages = [
      ...rawMessages,
      {
        role: "assistant",
        content: currentToolCalls.map((tc) => ({
          type: "tool_use" as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
      },
      {
        role: "user",
        content: roundResults.map((r) => ({
          type: "tool_result" as const,
          tool_use_id: r.id,
          content: r.resultText,
        })),
      },
    ];

    try {
      const followUp = await completeWithToolsRaw(config, system, rawMessages);
      content = followUp.content;
      currentToolCalls = followUp.toolCalls;
      if (followUp.usage) {
        usage = {
          prompt_tokens: (usage.prompt_tokens ?? 0) + (followUp.usage.prompt_tokens ?? 0),
          completion_tokens: (usage.completion_tokens ?? 0) + (followUp.usage.completion_tokens ?? 0),
        };
      }
    } catch {
      if (!content) {
        content = roundResults.map((r) => r.resultText).join("\n");
      }
      currentToolCalls = [];
    }
  }

  await supabase.from("llm_routing_log").insert({
    user_id: user.id,
    session_id: sid,
    provider: config.provider,
    model: config.model,
    prompt_tokens: usage.prompt_tokens ?? null,
    completion_tokens: usage.completion_tokens ?? null,
    latency_ms: latencyMs,
    tools_called: toolsCalled.length ? toolsCalled : null,
  });

  const newMessages = [
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    {
      role: "assistant" as const,
      content,
      tool_calls: toolCalls.length ? toolCalls : undefined,
    },
  ];
  await supabase
    .from("chat_sessions")
    .update({
      messages: newMessages,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", sid)
    .eq("user_id", user.id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const tr of toolResults) {
        controller.enqueue(encoder.encode(JSON.stringify(tr) + "\n"));
      }
      if (content) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "content", text: content }) + "\n"));
      }
      controller.enqueue(encoder.encode(JSON.stringify({ type: "done", sessionId: sid }) + "\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
