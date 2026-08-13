"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import type { ChatMessage } from "@/lib/ai/types";

export function useActiveChat({
  chatId,
  initialMessages,
  initialModelId,
  onFinish,
}: {
  chatId: string;
  initialMessages: ChatMessage[];
  initialModelId: string;
  onFinish?: () => void;
}) {
  const [modelId, setModelIdState] = React.useState(initialModelId);
  const modelIdRef = React.useRef(modelId);

  React.useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);

  // The transport is created once and kept for the component's lifetime; it
  // reads modelIdRef.current lazily at request time (never during render),
  // which is the standard "latest ref" pattern for stable callbacks.
  /* eslint-disable react-hooks/refs */
  const [transport] = React.useState(
    () =>
      new DefaultChatTransport<ChatMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest({ id, messages }) {
          return {
            body: {
              id,
              message: messages.at(-1),
              selectedModelId: modelIdRef.current,
            },
          };
        },
      })
  );
  /* eslint-enable react-hooks/refs */

  const chat = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish,
    onError: (error) => {
      console.error(error);
      toast.error("Bir şeyler ters gitti. Lütfen tekrar deneyin.");
    },
  });

  const setModelId = React.useCallback((id: string) => {
    setModelIdState(id);
    try {
      window.localStorage.setItem("chat-model", id);
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }, []);

  return { ...chat, modelId, setModelId };
}
