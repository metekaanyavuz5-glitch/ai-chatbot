"use client";

import { AlertCircle, Sparkles } from "lucide-react";
import { Markdown } from "./markdown";
import { ToolLoadingCard, NewsCard, LinkedInCard, YoutubeCard } from "./tool-cards";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/ai/types";

function hasRenderableContent(message: ChatMessage) {
  return message.parts.some((part) => {
    if (part.type === "text") return part.text.length > 0;
    return part.type === "file" || part.type.startsWith("tool-");
  });
}

export function Message({
  message,
  isStreaming,
  hasError,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  hasError?: boolean;
}) {
  const isUser = message.role === "user";

  if (!isUser && hasError && !hasRenderableContent(message)) {
    return (
      <div className="flex w-full animate-fade-in-up justify-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="size-3.5" />
        </div>
        <div className="flex items-center rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          Yanıt oluşturulamadı. Lütfen tekrar dene.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full gap-3 animate-fade-in-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-3.5" />
        </div>
      )}

      <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-2 sm:max-w-[75%]")}>
        {message.parts.map((part, index) => {
          const isLastPart = index === message.parts.length - 1;
          const key = `${message.id}-${index}`;

          if (part.type === "text") {
            if (!part.text) return null;
            if (isUser) {
              return (
                <div
                  key={key}
                  className="whitespace-pre-wrap break-words rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm"
                >
                  {part.text}
                </div>
              );
            }
            return (
              <div
                key={key}
                className={cn(isStreaming && isLastPart && "streaming-caret")}
              >
                <Markdown>{part.text}</Markdown>
              </div>
            );
          }

          if (part.type === "file" && part.mediaType?.startsWith("image/")) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={key}
                src={part.url}
                alt={part.filename ?? "Yüklenen görsel"}
                className="max-h-64 w-auto rounded-xl border object-contain"
              />
            );
          }

          if (part.type === "tool-getNews") {
            if (part.state === "output-available") {
              return <NewsCard key={key} output={part.output} />;
            }
            return <ToolLoadingCard key={key} label="Haberler getiriliyor…" />;
          }

          if (part.type === "tool-getLinkedInProfile") {
            if (part.state === "output-available") {
              return <LinkedInCard key={key} output={part.output} />;
            }
            return <ToolLoadingCard key={key} label="LinkedIn profili okunuyor…" />;
          }

          if (part.type === "tool-summarizeYoutubeVideo") {
            if (part.state === "output-available") {
              return <YoutubeCard key={key} output={part.output} />;
            }
            return <ToolLoadingCard key={key} label="YouTube videosu inceleniyor…" />;
          }

          return null;
        })}
      </div>
    </div>
  );
}
