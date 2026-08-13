"use client";

import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <Streamdown
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground",
        "prose-headings:font-semibold prose-a:text-primary prose-a:underline-offset-4",
        className
      )}
      shikiTheme={["github-light", "github-dark"]}
    >
      {children}
    </Streamdown>
  );
}
