import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Yeni sohbet"),
  modelId: text("model_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  parts: jsonb("parts").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type DbMessage = typeof messages.$inferSelect;
export type NewDbMessage = typeof messages.$inferInsert;
