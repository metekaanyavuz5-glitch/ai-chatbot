import { AppShell } from "@/components/chat/app-shell";
import { ChatShell } from "@/components/chat/chat-shell";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import type { ChatMessage } from "@/lib/ai/types";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chat = await getChatById(id);
  const rows = chat ? await getMessagesByChatId(id) : [];

  const initialMessages: ChatMessage[] = rows.map((row) => ({
    id: row.id,
    role: row.role as ChatMessage["role"],
    parts: row.parts as ChatMessage["parts"],
  }));

  return (
    <AppShell activeChatId={id}>
      <ChatShell
        chatId={id}
        initialMessages={initialMessages}
        initialModelId={chat?.modelId ?? DEFAULT_MODEL_ID}
      />
    </AppShell>
  );
}
