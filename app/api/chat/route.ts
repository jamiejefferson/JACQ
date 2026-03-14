import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { assembleContext, formatContextBlock } from "@/lib/context";
import { resolveLLMConfig, completeWithTools, completeWithToolsRaw } from "@/lib/llm-client";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { executeTool } from "@/lib/tool-execution";
import { TOOL_STATUS_MESSAGES } from "@/lib/llm-tools";

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

  // Start streaming immediately — processing happens in background
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const emit = async (event: Record<string, unknown>) => {
    await writer.write(encoder.encode(JSON.stringify(event) + "\n"));
  };

  (async () => {
    try {
      await emit({ type: "status", message: "Thinking..." });

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

      const result = await completeWithTools(config, system, apiMessages);
      content = result.content;
      toolCalls = result.toolCalls;
      usage = result.usage ?? {};

      const latencyMs = Date.now() - start;

      const toolsCalled: string[] = [];

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

          // Emit status for this tool
          await emit({ type: "status", message: TOOL_STATUS_MESSAGES[tc.name] || "Working on it..." });

          const toolResult = await executeTool(supabase, user.id, sid, tc.name, tc.input);

          const resultText = toolResult.ok
            ? (toolResult.data ?? `Done: ${tc.name}`)
            : `Failed: ${toolResult.reason ?? "unknown error"}`;
          roundResults.push({ id: tc.id, name: tc.name, input: tc.input, resultText });

          if (toolResult.ok && toolResult.data) hasDataResults = true;

          // Stream tool result immediately
          if (toolResult.ok && toolResult.tool === "extract_understanding") {
            await emit({
              type: "tool_result",
              tool: toolResult.tool,
              label: toolResult.label,
              section: toolResult.section,
            });
          } else if (toolResult.ok) {
            await emit({ type: "tool_result", tool: toolResult.tool });
          } else {
            await emit({ type: "tool_result", tool: toolResult.tool, ok: false, reason: toolResult.reason ?? "Tool failed" });
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

        await emit({ type: "status", message: "Thinking..." });

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

      if (content) {
        await emit({ type: "content", text: content });
      }
      await emit({ type: "done", sessionId: sid });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      await emit({ type: "error", message });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
