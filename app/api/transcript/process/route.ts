import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { assembleContext, formatContextBlock } from "@/lib/context";
import { resolveLLMConfig, completeWithTools, completeWithToolsRaw } from "@/lib/llm-client";
import { buildTranscriptSystemPrompt } from "@/lib/transcript-prompt";
import { executeTool } from "@/lib/tool-execution";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const { supabase, user } = auth;

  const config = await resolveLLMConfig(supabase, user.id);
  if (!config) {
    return NextResponse.json(
      { error: "LLM not configured. Set up your AI in onboarding or settings." },
      { status: 400 }
    );
  }

  const pkg = await assembleContext(supabase, user.id);
  const contextBlock = formatContextBlock(pkg);
  const system = buildTranscriptSystemPrompt(contextBlock);

  const userMessage = `Process this meeting transcript and create any tasks, commitments, contacts, calendar events, or email drafts that are clearly stated. Do not invent details.\n\n---\n\n${transcript}`;

  const apiMessages = [{ role: "user" as const, content: userMessage }];

  let content = "";
  let toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
  let rawMessages: Array<{ role: "user" | "assistant"; content: unknown }> = apiMessages.map((m) => ({
    role: m.role,
    content: m.content as unknown,
  }));

  const result = await completeWithTools(config, system, apiMessages);
  content = result.content;
  toolCalls = result.toolCalls;

  const MAX_TOOL_ROUNDS = 3;
  for (let round = 0; round < MAX_TOOL_ROUNDS && toolCalls.length > 0; round++) {
    const roundResults: Array<{ id: string; name: string; input: Record<string, unknown>; resultText: string }> = [];

    for (const tc of toolCalls) {
      const toolResult = await executeTool(supabase, user.id, sessionId, tc.name, tc.input);
      const resultText = toolResult.ok
        ? (toolResult.data ?? `Done: ${tc.name}`)
        : `Failed: ${toolResult.reason ?? "unknown error"}`;
      roundResults.push({ id: tc.id, name: tc.name, input: tc.input, resultText });
    }

    rawMessages = [
      ...rawMessages,
      {
        role: "assistant" as const,
        content: toolCalls.map((tc) => ({
          type: "tool_use" as const,
          id: tc.id,
          name: tc.name,
          input: tc.input,
        })),
      },
      {
        role: "user" as const,
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
      toolCalls = followUp.toolCalls;
    } catch {
      toolCalls = [];
    }
  }

  let sid = sessionId;
  if (sid) {
    const { data: existing } = await supabase
      .from("chat_sessions")
      .select("id, messages")
      .eq("id", sid)
      .eq("user_id", user.id)
      .single();

    if (existing?.messages && content) {
      const messages = existing.messages as Array<{ role: string; content: string }>;
      const updated = [
        ...messages,
        { role: "user", content: "[Imported transcript]" },
        { role: "assistant", content },
      ];
      await supabase
        .from("chat_sessions")
        .update({
          messages: updated,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", sid)
        .eq("user_id", user.id);
    }
  }

  return NextResponse.json({
    summary: content || "Transcript processed. Check your tasks and commitments.",
    sessionId: sid,
  });
}
