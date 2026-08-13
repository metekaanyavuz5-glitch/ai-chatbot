"use client";

import { ArrowDown, Newspaper, Contact, Video, ImagePlus } from "lucide-react";
import { Message } from "./message";
import { Button } from "@/components/ui/button";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import type { ChatMessage } from "@/lib/ai/types";
import type { ChatStatus } from "ai";

const SUGGESTIONS = [
  { icon: Newspaper, text: "BBC'nin son 5 haberini göster" },
  { icon: Video, text: "Bu YouTube videosunu özetle: [link yapıştır]" },
  { icon: Contact, text: "Bu LinkedIn profilini incele: [profil linki]" },
  { icon: ImagePlus, text: "Bu görselde ne var? (görsel ekle)" },
];

export function Messages({
  messages,
  status,
  onSuggestion,
}: {
  messages: ChatMessage[];
  status: ChatStatus;
  onSuggestion: (text: string) => void;
}) {
  const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom<HTMLDivElement>([
    messages,
    status,
  ]);

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="thin-scrollbar h-full overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Bugün sana nasıl yardımcı olabilirim?
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Haberleri özetleyebilir, görselleri yorumlayabilir, YouTube videolarını
                  özetleyebilir ve daha fazlasını yapabilirim.
                </p>
              </div>
              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => onSuggestion(text)}
                    className="flex items-start gap-2.5 rounded-xl border bg-card px-3.5 py-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, i) => (
              <Message
                key={message.id}
                message={message}
                isStreaming={isStreaming && i === messages.length - 1}
                hasError={status === "error" && i === messages.length - 1}
              />
            ))
          )}
          <div ref={endRef} className="h-px w-full shrink-0" />
        </div>
      </div>

      {!isAtBottom && messages.length > 0 && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-4 left-1/2 size-9 -translate-x-1/2 rounded-full border shadow-md"
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="size-4" />
        </Button>
      )}
    </div>
  );
}
