import "server-only";
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

export const db = drizzle(sql, { schema });

let bootstrapPromise: Promise<void> | null = null;

// Lazy, idempotent bootstrap: only runs on first real query (memoized),
// never at module-import time (avoids build-time execution when no DB is reachable yet).
export function ensureSchema(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL DEFAULT 'Yeni sohbet',
          model_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          parts JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id)`;
    })();
  }
  return bootstrapPromise;
}
