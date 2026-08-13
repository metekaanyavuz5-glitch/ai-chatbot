"use client";

import { Eye, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chatModels, getChatModel, providerLabels, type ModelProvider } from "@/lib/ai/models";

const providerOrder: ModelProvider[] = ["google", "anthropic", "meta", "amazon", "mistral", "deepseek", "openai"];

export function ModelSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const current = getChatModel(value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className="h-8 gap-1.5 rounded-full border-none bg-muted px-3 text-xs font-medium shadow-none hover:bg-accent"
      >
        <Sparkles className="size-3.5 text-primary" />
        <SelectValue>{current.name}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="max-h-80">
        {providerOrder.map((provider) => {
          const models = chatModels.filter((m) => m.provider === provider);
          if (models.length === 0) return null;
          return (
            <SelectGroup key={provider}>
              <SelectLabel>{providerLabels[provider]}</SelectLabel>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm">
                      {model.name}
                      {model.vision && <Eye className="size-3 text-muted-foreground" />}
                    </span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
