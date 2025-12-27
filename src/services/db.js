import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbFile = path.join(process.cwd(), 'data', 'app.db');
const dataDir = path.dirname(dbFile);

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      provider TEXT DEFAULT 'local',
      provider_sub TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add provider_sub if missing (existing DBs)
  const cols = db.prepare("PRAGMA table_info('users')").all();
  const hasProviderSub = cols.some(c => c.name === 'provider_sub');
  if (!hasProviderSub) {
    db.exec("ALTER TABLE users ADD COLUMN provider_sub TEXT;");
  }

  // Ensure password_hash is non-null for existing rows (legacy NOT NULL constraint)
  db.exec("UPDATE users SET password_hash = '' WHERE password_hash IS NULL;");
}

let db;

export function getDb() {
  if (db) return db;
  ensureDir();
  db = new Database(dbFile);
  initSchema(db);
  return db;
}
