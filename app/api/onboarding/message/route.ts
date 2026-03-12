import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/lib/api-auth";
import { ONBOARDING_SYSTEM_PROMPT, ONBOARDING_JUMPOFF_SUMMARY_PROMPT } from "@/lib/onboarding-prompts";
import { resolveLLMConfig, completeWithTools } from "@/lib/llm-client";
import { executeTool } from "@/lib/tool-execution";
import { getOnboardingTools } from "@/lib/llm-tools";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const history = (body.messages ?? []) as Array<{ role: string; content: string }>;
  const summaryOnly = body.summaryOnly === true;

  if (!summaryOnly && !message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const { supabase, user } = auth;

  const config = await resolveLLMConfig(supabase, user.id);
  if (!config) {
    return NextResponse.json(
      { error: "LLM not configured. Complete the previous step." },
      { status: 400 }
    );
  }

  if (summaryOnly) {
    const summaryMessages = [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: "I'd like to jump off for now." },
    ];
    let summaryContent = "";
    try {
      const result = await completeWithTools(config, ONBOARDING_JUMPOFF_SUMMARY_PROMPT, summaryMessages, []);
      summaryContent = result.content;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "LLM request failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        if (summaryContent) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "content", text: summaryContent }) + "\n"));
        }
        controller.enqueue(encoder.encode(JSON.stringify({ type: "done", sessionId, completionSuggested: false }) + "\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
    });
  }

  let sid = sessionId;
  if (!sid) {
    const { data: newSession, error: createError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        session_type: "onboarding",
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
      .eq("session_type", "onboarding")
      .single();
    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  let content = "";
  let toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

  try {
    const result = await completeWithTools(
      config,
      ONBOARDING_SYSTEM_PROMPT,
      messages,
      getOnboardingTools()
    );
    content = result.content;
    toolCalls = result.toolCalls;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const toolResults: Array<{ type: string; tool: string; label?: string; section?: string; ok?: boolean; reason?: string }> = [];
  for (const tc of toolCalls) {
    const result = await executeTool(supabase, user.id, sid, tc.name, tc.input);
    if (result.ok && result.tool === "extract_understanding") {
      toolResults.push({ type: "tool_result", tool: result.tool, label: result.label, section: result.section });
    } else if (result.ok) {
      toolResults.push({ type: "tool_result", tool: result.tool });
    } else {
      toolResults.push({ type: "tool_result", tool: result.tool, ok: false, reason: result.reason ?? "Tool failed" });
    }
  }

  const sessionMessages = (await supabase.from("chat_sessions").select("messages").eq("id", sid).eq("user_id", user.id).single()).data?.messages as Array<{ role: string; content: string }> ?? [];
  const newMessages = [
    ...sessionMessages,
    { role: "user", content: message },
    { role: "assistant", content, tool_calls: toolCalls.length ? toolCalls : undefined },
  ];
  await supabase
    .from("chat_sessions")
    .update({ messages: newMessages, last_message_at: new Date().toISOString() })
    .eq("id", sid)
    .eq("user_id", user.id);

  const completionHint = /get your accounts connected|shall we connect|connect your accounts/i.test(content);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const tr of toolResults) {
        controller.enqueue(encoder.encode(JSON.stringify(tr) + "\n"));
      }
      if (content) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "content", text: content }) + "\n"));
      }
      controller.enqueue(encoder.encode(JSON.stringify({ type: "done", sessionId: sid, completionSuggested: completionHint }) + "\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
