"use client";

import * as React from "react";
import type { Chat } from "@/lib/db/schema";

type HistoryContextValue = {
  chats: Chat[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  removeChat: (id: string) => void;
};

const HistoryContext = React.createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return;
      const data = (await res.json()) as { chats: Chat[] };
      setChats(data.chats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const removeChat = React.useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <HistoryContext.Provider value={{ chats, isLoading, refresh, removeChat }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = React.useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}
