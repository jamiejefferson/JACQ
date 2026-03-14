import { getSupabaseAndUser } from "@/lib/api-auth";
import { assembleContext } from "@/lib/context";
import { resolveLLMConfig } from "@/lib/llm-client";
import { generateWebGreeting, buildProactiveMessage } from "@/lib/proactivity";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getSupabaseAndUser();
  if ("response" in auth) return auth.response;

  const { supabase, user } = auth;

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const emit = async (event: Record<string, unknown>) => {
    await writer.write(encoder.encode(JSON.stringify(event) + "\n"));
  };

  (async () => {
    try {
      const [config, pkg] = await Promise.all([
        resolveLLMConfig(supabase, user.id),
        assembleContext(supabase, user.id),
      ]);

      if (!config) {
        const canned = buildProactiveMessage(pkg, "greeting");
        await emit({ type: "content", text: canned });
        await emit({ type: "done" });
        return;
      }

      // Race LLM greeting against a 3-second timeout
      const TIMEOUT_MS = 3000;
      const llmPromise = generateWebGreeting(config, pkg);
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TIMEOUT_MS)
      );

      const greeting = await Promise.race([llmPromise, timeoutPromise]);

      if (greeting) {
        await emit({ type: "content", text: greeting });
      } else {
        await emit({
          type: "content",
          text: "Heya, just to let you know, I'm running a little slow so may struggle to respond.",
        });
      }
      await emit({ type: "done" });
    } catch {
      await emit({
        type: "content",
        text: "Heya, just to let you know, I'm running a little slow so may struggle to respond.",
      });
      await emit({ type: "done" });
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
