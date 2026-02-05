import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDb() {
  if (db) return;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'deskai.db');

  console.log('Initializing database at:', dbPath);

  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath, { verbose: console.log });

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  // Enable Foreign Key enforcement (CRITICAL for data integrity)
  db.pragma('foreign_keys = ON');

  // Check for legacy favorites table and drop if incompatible (refJson is old column)
  try {
    const favInfo = db.pragma('table_info(favorites)') as any[];
    if (favInfo && favInfo.length > 0 && favInfo.some(c => c.name === 'refJson')) {
      console.log('Dropping legacy favorites table (schema mismatch)');
      db.prepare('DROP TABLE favorites').run();
    }
  } catch (err) {
    console.error('Error checking legacy favorites:', err);
  }

  // Create tables
  const schema = `
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'folder',
      status TEXT DEFAULT 'pending',
      totalFiles INTEGER DEFAULT 0,
      indexedFiles INTEGER DEFAULT 0,
      failedFiles INTEGER DEFAULT 0,
      lastUpdate INTEGER,
      includeTypes TEXT,
      excludePatterns TEXT,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS source_errors (
      id TEXT PRIMARY KEY,
      sourceId TEXT NOT NULL,
      filePath TEXT,
      message TEXT,
      createdAt INTEGER,
      FOREIGN KEY(sourceId) REFERENCES sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      sourceId TEXT,
      name TEXT NOT NULL,
      extension TEXT,
      type TEXT, -- doc, code, pdf, etc.
      size INTEGER,
      mtime INTEGER,
      indexedAt INTEGER,
      status TEXT DEFAULT 'pending', -- pending, indexed, error
      hash TEXT,
      isFavorite INTEGER DEFAULT 0,
      errorMessage TEXT,
      FOREIGN KEY(sourceId) REFERENCES sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      fileId TEXT NOT NULL,
      chunkIndex INTEGER,
      startOffset INTEGER,
      endOffset INTEGER,
      text TEXT,
      created_at_ms INTEGER,
      FOREIGN KEY(fileId) REFERENCES files(id) ON DELETE CASCADE
    );

    -- FTS5 Virtual Table (External Content)
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      text,
      content='chunks',
      content_rowid='rowid',
      tokenize='unicode61 remove_diacritics 2'
    );

    -- Triggers to keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, text) VALUES (new.rowid, new.text);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.rowid, old.text);
    END;

    CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
      INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.rowid, old.text);
      INSERT INTO chunks_fts(rowid, text) VALUES (new.rowid, new.text);
    END;

    CREATE TABLE IF NOT EXISTS tags (
      fileId TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (fileId, tag),
      FOREIGN KEY(fileId) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id            TEXT PRIMARY KEY,
      kind          TEXT NOT NULL,     -- 'DOCUMENT' | 'SNIPPET' | 'ANSWER'
      title         TEXT,              -- user rename (optional)
      ref_json      TEXT NOT NULL,     -- JSON: trỏ tới file/chunk/answer
      tags_json     TEXT DEFAULT '[]', -- JSON array
      pinned        INTEGER NOT NULL DEFAULT 0,
      created_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL,
      used_count    INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_fav_kind ON favorites(kind);
    CREATE INDEX IF NOT EXISTS idx_fav_pinned ON favorites(pinned);
    CREATE INDEX IF NOT EXISTS idx_fav_created ON favorites(created_at_ms);

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- SCAN | INDEX_FILE | DELETE_FILE
      status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
      payloadJson TEXT,
      error TEXT,
      createdAt INTEGER
    );
  `;

  db.exec(schema);

  // Migration: Ensure 'type' column exists (for existing DBs)
  try {
    db.prepare('ALTER TABLE files ADD COLUMN type TEXT').run();
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.log('Migration check: type column already exists or error', e.message);
    }
  }

  // Migration: Ensure 'isFavorite' column exists
  try {
    db.prepare('ALTER TABLE files ADD COLUMN isFavorite INTEGER DEFAULT 0').run();
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.log('Migration check: isFavorite column already exists or error', e.message);
    }
  }

  // Migration: Ensure 'errorMessage' column exists
  try {
    db.prepare('ALTER TABLE files ADD COLUMN errorMessage TEXT').run();
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      console.log('Migration check: errorMessage column already exists or error', e.message);
    }
  }

  // Migration: Ensure 'created_at_ms' in chunks
  try {
    db.prepare('ALTER TABLE chunks ADD COLUMN created_at_ms INTEGER').run();
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) {
      // ignore
    }
  }

  console.log('Database initialized successfully');
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
