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
      password_hash TEXT NOT NULL,
      provider TEXT DEFAULT 'local',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

let db;

export function getDb() {
  if (db) return db;
  ensureDir();
  db = new Database(dbFile);
  initSchema(db);
  return db;
}
