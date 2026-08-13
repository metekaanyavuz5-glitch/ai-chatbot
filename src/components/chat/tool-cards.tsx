"use client";

import { Loader2, Newspaper, Contact, Video, ExternalLink, AlertCircle } from "lucide-react";
import type { ChatTools } from "@/lib/ai/types";

type NewsOutput = ChatTools["getNews"]["output"];
type LinkedInOutput = ChatTools["getLinkedInProfile"]["output"];
type YoutubeOutput = ChatTools["summarizeYoutubeVideo"]["output"];

export function ToolLoadingCard({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card/50 px-3.5 py-2.5 text-sm text-muted-foreground animate-fade-in-up">
      <Loader2 className="size-3.5 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function NewsCard({ output }: { output: NewsOutput }) {
  if (!output) return null;
  if (output.items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm text-muted-foreground animate-fade-in-up">
        <AlertCircle className="size-3.5 shrink-0" />
        {output.error ?? "Haber bulunamadı."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border bg-card animate-fade-in-up">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3.5 py-2">
        <Newspaper className="size-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          {output.publisher} · son {output.items.length} haber
        </span>
      </div>
      <ul className="divide-y">
        {output.items.map((item, i) => (
          <li key={i}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 px-3.5 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex-1 leading-snug">{item.title}</span>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LinkedInCard({ output }: { output: LinkedInOutput }) {
  if (!output) return null;
  if (!output.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm text-muted-foreground animate-fade-in-up">
        <AlertCircle className="size-3.5 shrink-0" />
        {output.error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border bg-card animate-fade-in-up">
      <a
        href={output.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 border-b bg-muted/40 px-3.5 py-2 hover:bg-accent transition-colors"
      >
        <Contact className="size-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground truncate">{output.url}</span>
        <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </a>
    </div>
  );
}

export function YoutubeCard({ output }: { output: YoutubeOutput }) {
  if (!output) return null;
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border bg-card animate-fade-in-up">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3.5 py-2">
        <Video className="size-3.5 text-primary" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{output.title ?? "YouTube videosu"}</span>
          {output.author && (
            <span className="text-[11px] text-muted-foreground truncate">{output.author}</span>
          )}
        </div>
        {!output.ok && <AlertCircle className="ml-auto size-3.5 shrink-0 text-destructive" />}
      </div>
      {!output.ok && (
        <p className="px-3.5 py-2.5 text-sm text-muted-foreground">{output.error}</p>
      )}
    </div>
  );
}
