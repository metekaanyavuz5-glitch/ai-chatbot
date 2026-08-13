"use client";

import * as React from "react";
import { Messages } from "./messages";
import { Composer, type Attachment } from "./composer";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useHistory } from "./history-provider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isValidModelId } from "@/lib/ai/models";
import type { ChatMessage } from "@/lib/ai/types";

export function ChatShell({
  chatId,
  initialMessages,
  initialModelId,
}: {
  chatId: string;
  initialMessages: ChatMessage[];
  initialModelId: string;
}) {
  const { refresh } = useHistory();
  const hasHydratedModel = React.useRef(false);

  const { messages, sendMessage, status, stop, modelId, setModelId } = useActiveChat({
    chatId,
    initialMessages,
    initialModelId,
    onFinish: () => {
      refresh();
    },
  });

  React.useEffect(() => {
    if (hasHydratedModel.current) return;
    hasHydratedModel.current = true;
    if (initialMessages.length > 0) return;
    try {
      const stored = window.localStorage.getItem("chat-model");
      if (stored && isValidModelId(stored)) setModelId(stored);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(text: string, attachments: Attachment[]) {
    if (messages.length === 0) {
      setTimeout(refresh, 400);
    }
    sendMessage({
      role: "user",
      parts: [
        ...attachments.map((a) => ({
          type: "file" as const,
          mediaType: a.mediaType,
          filename: a.filename,
          url: a.dataUrl,
        })),
        ...(text ? [{ type: "text" as const, text }] : []),
      ],
    });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <SidebarTrigger />
        <span className="text-sm font-medium text-muted-foreground">Voyage AI</span>
      </header>

      <Messages messages={messages} status={status} onSuggestion={(text) => handleSubmit(text, [])} />

      <Composer
        status={status}
        modelId={modelId}
        onModelChange={setModelId}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </div>
  );
}
