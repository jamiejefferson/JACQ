import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsightTrigger } from "./insights";
import { assembleContext, formatContextBlock } from "./context";
import { resolveLLMConfig, completeWithToolsRaw } from "./llm-client";
import { ALL_TOOLS } from "./llm-tools";
import { executeTool } from "./tool-execution";
import { JACQ_PERSONALITY } from "./system-prompt";

export type InsightOutput = {
  issues: Array<{ summary: string; detail?: string; severity?: string }>;
  opportunities: Array<{ summary: string; detail?: string }>;
  actions: Array<{ summary: string; owner?: string; status?: string }>;
  raw_text: string;
  tools_used: string[];
};

const MAX_TOOL_ROUNDS = 3;

const INVESTIGATION_PREAMBLE = `You are running a proactive investigation. Use the tools available to you (calendar, email, tasks, contacts, web search) to research and gather information. After investigating, you will be asked to structure your findings.

Important:
- Use tools to look up real data — don't guess or make up information
- If a tool returns an error (e.g. not connected), note what you couldn't check and move on
- Focus on what's actionable and relevant`;

const STRUCTURING_PROMPT = `Based on your investigation, structure your findings as JSON in exactly this format (no other text, just the JSON):

{
  "issues": [{"summary": "brief issue", "detail": "explanation", "severity": "high|medium|low"}],
  "opportunities": [{"summary": "brief opportunity", "detail": "explanation"}],
  "actions": [{"summary": "what needs doing", "owner": "user|jacq", "status": "pending"}]
}

Rules:
- Only include items you found evidence for — don't fabricate
- Keep summaries under 20 words each
- If you found nothing notable in a category, use an empty array
- severity for issues: high = needs attention now, medium = worth noting, low = minor
- owner for actions: "user" if they need to do it, "jacq" if you can handle it`;

/**
 * Run a proactive insight investigation.
 * Calls the LLM with the trigger's prompt, runs tool loops, then asks for structured output.
 */
export async function runInsightTrigger(
  supabase: SupabaseClient,
  userId: string,
  trigger: InsightTrigger
): Promise<InsightOutput> {
  const pkg = await assembleContext(supabase, userId);
  const config = await resolveLLMConfig(supabase, userId);

  if (!config) {
    return {
      issues: [],
      opportunities: [],
      actions: [],
      raw_text: "Could not run insight — no LLM configured.",
      tools_used: [],
    };
  }

  const contextBlock = formatContextBlock(pkg);
  const system = `${JACQ_PERSONALITY}\n\n${INVESTIGATION_PREAMBLE}\n\n${contextBlock}`;

  const toolDefs = ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  // Messages array for multi-turn tool loop
  const messages: Array<{ role: "user" | "assistant"; content: unknown }> = [
    { role: "user", content: trigger.prompt },
  ];

  const toolsUsed: string[] = [];

  // Tool loop — same pattern as chat route
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await completeWithToolsRaw(config, system, messages, toolDefs);

    if (res.toolCalls.length === 0) {
      // No more tools to call — we have the investigation response
      if (res.content) {
        messages.push({
          role: "assistant",
          content: [{ type: "text", text: res.content }],
        });
      }
      break;
    }

    // Build assistant message with tool_use blocks
    const assistantContent: unknown[] = [];
    if (res.content) assistantContent.push({ type: "text", text: res.content });
    for (const tc of res.toolCalls) {
      assistantContent.push({
        type: "tool_use",
        id: tc.id,
        name: tc.name,
        input: tc.input,
      });
      if (!toolsUsed.includes(tc.name)) toolsUsed.push(tc.name);
    }
    messages.push({ role: "assistant", content: assistantContent });

    // Execute tools and build tool_result message
    const toolResults: unknown[] = [];
    for (const tc of res.toolCalls) {
      const result = await executeTool(supabase, userId, null, tc.name, tc.input);
      const resultText = result.ok
        ? result.data ?? `${tc.name} completed successfully`
        : `Error: ${result.reason}`;
      toolResults.push({
        type: "tool_result",
        tool_use_id: tc.id,
        content: resultText,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  // Get the raw investigation text
  const rawText = messages
    .filter((m) => m.role === "assistant")
    .map((m) => {
      if (typeof m.content === "string") return m.content;
      if (Array.isArray(m.content)) {
        return (m.content as Array<{ type: string; text?: string }>)
          .filter((b) => b.type === "text" && b.text)
          .map((b) => b.text)
          .join("\n");
      }
      return "";
    })
    .join("\n")
    .trim();

  // Ask LLM to structure the findings
  const structureMessages: Array<{ role: "user" | "assistant"; content: unknown }> = [
    ...messages,
    { role: "user", content: STRUCTURING_PROMPT },
  ];

  try {
    const structureRes = await completeWithToolsRaw(config, system, structureMessages, []);
    const structured = parseStructuredOutput(structureRes.content);
    if (structured) {
      return { ...structured, raw_text: rawText, tools_used: toolsUsed };
    }
  } catch (err) {
    console.error("[runInsightTrigger] Structuring call failed:", err);
  }

  // Fallback: return raw text without structure
  return {
    issues: [],
    opportunities: [],
    actions: [],
    raw_text: rawText || "Investigation completed but produced no output.",
    tools_used: toolsUsed,
  };
}

/** Try to parse the LLM's structured JSON output. */
function parseStructuredOutput(
  text: string
): { issues: InsightOutput["issues"]; opportunities: InsightOutput["opportunities"]; actions: InsightOutput["actions"] } | null {
  if (!text) return null;

  // Extract JSON from the response (may have surrounding text)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    return null;
  }
}

/** Format an insight result for Telegram delivery. */
export function formatInsightForTelegram(
  label: string,
  output: InsightOutput
): string {
  const lines: string[] = [];
  lines.push(`${label}`);
  lines.push("");

  if (output.issues.length > 0) {
    lines.push("Issues:");
    for (const i of output.issues) {
      const sev = i.severity === "high" ? "!!" : i.severity === "medium" ? "!" : "";
      lines.push(`${sev ? sev + " " : ""}${i.summary}`);
    }
    lines.push("");
  }

  if (output.opportunities.length > 0) {
    lines.push("Opportunities:");
    for (const o of output.opportunities) {
      lines.push(`${o.summary}`);
    }
    lines.push("");
  }

  if (output.actions.length > 0) {
    lines.push("Actions:");
    for (const a of output.actions) {
      const owner = a.owner === "jacq" ? "[Jacq]" : "[You]";
      lines.push(`${owner} ${a.summary}`);
    }
    lines.push("");
  }

  // If no structured data, fall back to raw text
  if (output.issues.length === 0 && output.opportunities.length === 0 && output.actions.length === 0) {
    if (output.raw_text) {
      lines.push(output.raw_text.slice(0, 3500));
    }
  }

  lines.push("Reply to discuss any of these.");

  // Telegram 4096 char limit
  const result = lines.join("\n");
  return result.length > 4000 ? result.slice(0, 3997) + "..." : result;
}
