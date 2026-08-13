import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import * as schema from "./schema";

type DbInstance = BetterSQLite3Database<typeof schema>;

let instance: DbInstance | null = null;

// Lazy singleton: the sqlite file is only created/opened on first real query,
// never at module-import time. This avoids multiple Next.js build workers
// racing to create the WAL-mode file simultaneously (SQLITE_BUSY).
function getDb(): DbInstance {
  if (instance) return instance;

  // Deliberately kept OUTSIDE the project directory: Next.js's dev file
  // watcher watches the whole project tree, and every write to a WAL-mode
  // sqlite file living inside it (e.g. under ./.data) triggers a "file
  // changed" event, which triggers a Fast Refresh rebuild, which can loop
  // indefinitely under load.
  const dataDir = process.env.DATABASE_DIR ?? path.join(os.homedir(), ".exposure-ai-chatbot");
  // turbopackIgnore: this path is runtime-only (user home dir), never part
  // of the app's own source/output, so it must not be traced for bundling.
  if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
    fs.mkdirSync(/*turbopackIgnore: true*/ dataDir, { recursive: true });
  }

  const sqlite = new Database(path.join(dataDir, "chat.db"));
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Yeni sohbet',
      model_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      parts TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
  `);

  instance = drizzle(sqlite, { schema });
  return instance;
}

export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
