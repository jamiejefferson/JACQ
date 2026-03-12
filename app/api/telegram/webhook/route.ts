import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assembleContext, formatContextBlock } from "@/lib/context";
import { resolveLLMConfig, completeWithTools } from "@/lib/llm-client";
import { executeTool } from "@/lib/tool-execution";

const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id: number };
  };
};

async function getBotToken(supabase: ReturnType<typeof createAdminClient>): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  const { data: config } = await supabase
    .from("telegram_bot_config")
    .select("bot_token")
    .eq("id", CONFIG_ID)
    .maybeSingle();
  return config?.bot_token ?? null;
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function handleStartCommand(
  supabase: ReturnType<typeof createAdminClient>,
  chatId: number,
  text: string,
  botToken: string | null
) {
  const linkToken = text.slice(6).trim();
  if (!linkToken) return;

  const { data: row, error: fetchError } = await supabase
    .from("telegram_link_tokens")
    .select("user_id")
    .eq("token", linkToken)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (fetchError || !row) return;

  await supabase.from("telegram_link_tokens").delete().eq("token", linkToken);

  await supabase.from("user_integrations").upsert(
    {
      user_id: row.user_id,
      provider: "telegram",
      status: "active",
      telegram_chat_id: String(chatId),
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (botToken) {
    await sendTelegramMessage(botToken, chatId, "You're connected to Jacq!");
  }
}

async function handleChatMessage(
  supabase: ReturnType<typeof createAdminClient>,
  chatId: number,
  text: string,
  botToken: string
) {
  // Look up user by telegram_chat_id
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("user_id")
    .eq("provider", "telegram")
    .eq("telegram_chat_id", String(chatId))
    .eq("status", "active")
    .maybeSingle();

  if (!integration) {
    await sendTelegramMessage(botToken, chatId, "I don't recognise this chat. Open Jacq in your browser and connect Telegram first.");
    return;
  }

  const userId = integration.user_id;

  // Resolve LLM config
  const config = await resolveLLMConfig(supabase, userId);
  if (!config) {
    await sendTelegramMessage(botToken, chatId, "I'm not set up with an AI provider yet. Open Jacq in your browser to configure it.");
    return;
  }

  // Get or create a Telegram chat session
  const { data: existingSession } = await supabase
    .from("chat_sessions")
    .select("id, messages")
    .eq("user_id", userId)
    .eq("channel", "telegram")
    .eq("status", "active")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sessionId: string;
  let previousMessages: Array<{ role: string; content: string }> = [];

  if (existingSession) {
    sessionId = existingSession.id;
    previousMessages = (existingSession.messages ?? []) as Array<{ role: string; content: string }>;
  } else {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        session_type: "in_app",
        channel: "telegram",
        messages: [],
        status: "active",
      })
      .select("id")
      .single();
    if (!newSession) {
      await sendTelegramMessage(botToken, chatId, "Something went wrong. Try again in a moment.");
      return;
    }
    sessionId = newSession.id;
  }

  // Keep last 20 messages for context
  const recentMessages = previousMessages.slice(-20);
  const allMessages = [...recentMessages, { role: "user", content: text }];

  // Build system prompt with context
  const pkg = await assembleContext(supabase, userId);
  const contextBlock = formatContextBlock(pkg);
  const system = `You are Jacq, a thoughtful PA that learns about the user and helps with tasks. You are chatting via Telegram — keep replies concise and conversational. Use the context below to personalise your replies. When the user tells you something about themselves, their preferences, or someone they know, use the appropriate tool to save it.\n\n${contextBlock}`;

  const apiMessages = allMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Call LLM
  const result = await completeWithTools(config, system, apiMessages);

  // Execute any tool calls
  for (const tc of result.toolCalls) {
    await executeTool(supabase, userId, sessionId, tc.name, tc.input);
  }

  // Save messages to session
  const updatedMessages = [
    ...allMessages,
    { role: "assistant", content: result.content },
  ];
  await supabase
    .from("chat_sessions")
    .update({
      messages: updatedMessages,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  // Send reply
  const reply = result.content || "I'm not sure how to respond to that.";
  await sendTelegramMessage(botToken, chatId, reply);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TelegramUpdate;
    const text = body.message?.text?.trim();
    const chatId = body.message?.chat?.id;

    if (!text || chatId == null) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();
    const botToken = await getBotToken(supabase);

    if (text.startsWith("/start")) {
      await handleStartCommand(supabase, chatId, text, botToken);
    } else if (botToken) {
      await handleChatMessage(supabase, chatId, text, botToken);
    }
  } catch {
    // Return 200 so Telegram does not retry
  }
  return NextResponse.json({ ok: true });
}
