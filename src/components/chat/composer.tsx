"use client";

import * as React from "react";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "./model-selector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getChatModel } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import type { ChatStatus } from "ai";

export type Attachment = {
  id: string;
  dataUrl: string;
  mediaType: string;
  filename: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function Composer({
  status,
  modelId,
  onModelChange,
  onSubmit,
  onStop,
}: {
  status: ChatStatus;
  modelId: string;
  onModelChange: (id: string) => void;
  onSubmit: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
}) {
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const model = getChatModel(modelId);
  const isBusy = status === "streaming" || status === "submitted";
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isBusy && !isUploading;

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const accepted: File[] = [];
    for (const file of list) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        toast.error(`Desteklenmeyen dosya türü: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} çok büyük (en fazla 4MB).`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setIsUploading(true);
    try {
      const next = await Promise.all(
        accepted.map(async (file) => ({
          id: crypto.randomUUID(),
          dataUrl: await readAsDataUrl(file),
          mediaType: file.type,
          filename: file.name,
        }))
      );
      setAttachments((prev) => [...prev, ...next]);
    } catch {
      toast.error("Görsel yüklenemedi.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSubmit() {
    if (!canSend) return;
    onSubmit(input.trim(), attachments);
    setInput("");
    setAttachments([]);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
      <div
        className="rounded-2xl border bg-card shadow-sm transition-shadow focus-within:shadow-md"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        }}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files);
          if (files.length > 0) handleFiles(files);
        }}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b px-3.5 pt-3.5">
            {attachments.map((att) => (
              <div key={att.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.dataUrl}
                  alt={att.filename}
                  className="size-16 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow"
                  aria-label="Görseli kaldır"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Bir mesaj yaz…"
          rows={1}
          className={cn(
            "max-h-52 min-h-11 resize-none border-none bg-transparent px-3.5 py-3 shadow-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              disabled={!model.vision || isUploading}
              title={model.vision ? "Görsel ekle" : `${model.name} görsel girdiyi desteklemiyor`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <ModelSelector value={modelId} onChange={onModelChange} disabled={isBusy} />
          </div>

          {isBusy ? (
            <Button size="icon" className="size-8 rounded-full" onClick={onStop}>
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="size-8 rounded-full"
              disabled={!canSend}
              onClick={handleSubmit}
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Yapay zeka hata yapabilir. Önemli bilgileri doğrulayın.
      </p>
    </div>
  );
}
