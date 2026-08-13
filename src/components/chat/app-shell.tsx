"use client";

import * as React from "react";
import { HistoryProvider } from "./history-provider";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppShell({
  children,
  activeChatId,
}: {
  children: React.ReactNode;
  activeChatId?: string;
}) {
  return (
    <HistoryProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar activeChatId={activeChatId} />
        <SidebarInset className="h-dvh overflow-hidden">{children}</SidebarInset>
      </SidebarProvider>
    </HistoryProvider>
  );
}
