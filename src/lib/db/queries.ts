import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./client";
import { chats, messages, type DbMessage } from "./schema";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export async function createChat({
  id,
  title,
  modelId,
}: {
  id: string;
  title?: string;
  modelId?: string;
}) {
  const now = new Date();
  await db.insert(chats).values({
    id,
    title: title ?? "Yeni sohbet",
    modelId: modelId ?? DEFAULT_MODEL_ID,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
}

export async function getChatById(id: string) {
  const rows = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAllChats() {
  return db.select().from(chats).orderBy(desc(chats.updatedAt));
}

export async function updateChatTitle(id: string, title: string) {
  await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(eq(chats.id, id));
}

export async function touchChat(id: string) {
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, id));
}

export async function deleteChat(id: string) {
  await db.delete(messages).where(eq(messages.chatId, id));
  await db.delete(chats).where(eq(chats.id, id));
}

export async function getMessagesByChatId(chatId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);
}

export async function saveMessages(rows: DbMessage[]) {
  if (rows.length === 0) return;
  await db.insert(messages).values(rows);
}

export async function deleteTrailingMessages({
  chatId,
  afterMessageId,
}: {
  chatId: string;
  afterMessageId: string;
}) {
  const rows = await getMessagesByChatId(chatId);
  const index = rows.findIndex((m) => m.id === afterMessageId);
  if (index === -1) return;
  const toDelete = rows.slice(index);
  for (const row of toDelete) {
    await db
      .delete(messages)
      .where(and(eq(messages.id, row.id), eq(messages.chatId, chatId)));
  }
}
