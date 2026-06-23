import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDbSchema } from '../db/schema';

const dbDir = path.resolve(process.cwd(), 'db');
const dbPath = path.resolve(dbDir, 'db.sqlite');

declare global {
  // eslint-disable-next-line no-var
  var dbInstance: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!globalThis.dbInstance) {
    // Ensure the db directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(dbPath);
    
    // Enable WAL (Write-Ahead Logging) mode for better performance
    db.pragma('journal_mode = WAL');
    
    // Enable Foreign Key support
    db.pragma('foreign_keys = ON');

    // Run schema migrations/creation if not exists
    initDbSchema(db, false);

    globalThis.dbInstance = db;
  }
  return globalThis.dbInstance;
}

export const db = getDb();
