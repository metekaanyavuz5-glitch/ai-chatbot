"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { isToday, isYesterday, subDays } from "date-fns";
import { PenSquare, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useHistory } from "./history-provider";
import { ThemeToggle } from "./theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Chat } from "@/lib/db/schema";

function groupChats(chats: Chat[]) {
  const groups: { label: string; items: Chat[] }[] = [
    { label: "Bugün", items: [] },
    { label: "Dün", items: [] },
    { label: "Son 7 gün", items: [] },
    { label: "Son 30 gün", items: [] },
    { label: "Daha eski", items: [] },
  ];
  const sevenDaysAgo = subDays(new Date(), 7);
  const thirtyDaysAgo = subDays(new Date(), 30);

  for (const chat of chats) {
    const date = new Date(chat.updatedAt);
    if (isToday(date)) groups[0].items.push(chat);
    else if (isYesterday(date)) groups[1].items.push(chat);
    else if (date > sevenDaysAgo) groups[2].items.push(chat);
    else if (date > thirtyDaysAgo) groups[3].items.push(chat);
    else groups[4].items.push(chat);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function AppSidebar({ activeChatId }: { activeChatId?: string }) {
  const { chats, isLoading, refresh, removeChat } = useHistory();
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = React.useState<Chat | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const groups = React.useMemo(() => groupChats(chats), [chats]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chat/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız oldu");
      removeChat(pendingDelete.id);
      toast.success("Sohbet silindi");
      if (pendingDelete.id === activeChatId) {
        router.push(`/chat/${nanoid()}`);
      }
    } catch {
      toast.error("Sohbet silinemedi, tekrar deneyin.");
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-1 py-1 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <span className="text-sm">Voyage AI</span>
          </Link>
          <SidebarTrigger />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Yeni sohbet"
              className="justify-center gap-2"
              onClick={() => {
                router.push(`/chat/${nanoid()}`);
                setTimeout(refresh, 300);
              }}
            >
              <PenSquare className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Yeni sohbet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="thin-scrollbar">
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuSkeleton key={i} showIcon />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : groups.length === 0 ? (
          <div className="px-4 py-6 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            Henüz sohbet yok. Yukarıdan yeni bir sohbet başlat.
          </div>
        ) : (
          groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={chat.id === activeChatId}
                        tooltip={chat.title}
                      >
                        <Link href={`/chat/${chat.id}`}>
                          <span className="truncate">{chat.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover
                        onClick={(e) => {
                          e.preventDefault();
                          setPendingDelete(chat);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-1 group-data-[collapsible=icon]:justify-center">
          <span className="text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            Yerel sohbet geçmişi
          </span>
          <ThemeToggle />
        </div>
      </SidebarFooter>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sohbeti sil</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; sohbetini kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Siliniyor…" : "Sil"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
