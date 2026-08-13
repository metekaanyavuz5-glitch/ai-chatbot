import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { nanoid } from "nanoid";
import { chatRequestSchema } from "./schema";
import { getLanguageModel } from "@/lib/ai/provider";
import { isValidModelId, DEFAULT_MODEL_ID, getChatModel } from "@/lib/ai/models";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { getNews } from "@/lib/ai/tools/get-news";
import { getLinkedInProfile } from "@/lib/ai/tools/get-linkedin-profile";
import { summarizeYoutubeVideo } from "@/lib/ai/tools/summarize-youtube";
import type { ChatMessage } from "@/lib/ai/types";
import {
  createChat,
  getChatById,
  getMessagesByChatId,
  saveMessages,
  touchChat,
  updateChatTitle,
} from "@/lib/db/queries";

export const maxDuration = 60;

function dbRowsToUiMessages(rows: Awaited<ReturnType<typeof getMessagesByChatId>>): ChatMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role as ChatMessage["role"],
    parts: row.parts as ChatMessage["parts"],
  }));
}

function firstTextFromMessage(message: ChatMessage): string {
  const part = message.parts.find((p) => p.type === "text");
  if (part && "text" in part) return part.text;
  return "Yeni sohbet";
}

function titleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed || "Yeni sohbet";
}

function hasRenderableContent(message: ChatMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") return part.text.length > 0;
    return part.type === "file" || part.type.startsWith("tool-");
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { id: chatId, message, selectedModelId } = parsed.data;
  const modelId = isValidModelId(selectedModelId) ? selectedModelId : DEFAULT_MODEL_ID;
  const { supportsTools, provider, anthropicApiId } = getChatModel(modelId);
  const userMessage = message as ChatMessage;

  let chat = await getChatById(chatId);
  const isNewChat = !chat;
  if (!chat) {
    await createChat({ id: chatId, title: titleFromText(firstTextFromMessage(userMessage)), modelId });
    chat = await getChatById(chatId);
  } else {
    await touchChat(chatId);
  }

  const priorRows = await getMessagesByChatId(chatId);
  const priorMessages = dbRowsToUiMessages(priorRows);
  const uiMessages: ChatMessage[] = [...priorMessages, userMessage];

  await saveMessages([
    {
      id: userMessage.id,
      chatId,
      role: "user",
      parts: userMessage.parts,
      createdAt: new Date(),
    },
  ]);

  const modelMessages = await convertToModelMessages(uiMessages);

  const stream = createUIMessageStream<ChatMessage>({
    originalMessages: uiMessages,
    generateId: () => nanoid(),
    execute: ({ writer }) => {
      const result = streamText({
        model: getLanguageModel(modelId, provider, anthropicApiId),
        system: getSystemPrompt(supportsTools),
        messages: modelMessages,
        stopWhen: stepCountIs(5),
        tools: supportsTools ? { getNews, getLinkedInProfile, summarizeYoutubeVideo } : undefined,
        experimental_transform: smoothStream({ chunking: "word" }),
      });
      writer.merge(toUIMessageStream({ stream: result.stream }));
    },
    onError: (error) => {
      console.error("Chat stream error", error);
      return "Bir hata oluştu. Lütfen tekrar deneyin.";
    },
    onEnd: async ({ responseMessage, isAborted }) => {
      // Skip persisting turns that errored out before producing any content
      // (e.g. the model call failed) — otherwise a permanently-empty
      // assistant bubble is left behind after reload.
      if (!isAborted && hasRenderableContent(responseMessage)) {
        await saveMessages([
          {
            id: responseMessage.id,
            chatId,
            role: "assistant",
            parts: responseMessage.parts,
            createdAt: new Date(),
          },
        ]);
      }
      if (isNewChat) {
        await updateChatTitle(chatId, titleFromText(firstTextFromMessage(userMessage)));
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
