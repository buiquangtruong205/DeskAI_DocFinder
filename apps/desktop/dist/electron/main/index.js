"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/src/services/storage/db.ts
var db_exports = {};
__export(db_exports, {
  closeDb: () => closeDb,
  getDb: () => getDb,
  initDb: () => initDb
});
function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
async function initDb() {
  if (db)
    return;
  const userDataPath = import_electron.app.getPath("userData");
  const dbPath = path.join(userDataPath, "deskai.db");
  console.log("Initializing database at:", dbPath);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new import_better_sqlite3.default(dbPath, { verbose: console.log });
  db.pragma("journal_mode = WAL");
  try {
    const favInfo = db.pragma("table_info(favorites)");
    if (favInfo && favInfo.length > 0 && favInfo.some((c) => c.name === "refJson")) {
      console.log("Dropping legacy favorites table (schema mismatch)");
      db.prepare("DROP TABLE favorites").run();
    }
  } catch (err) {
    console.error("Error checking legacy favorites:", err);
  }
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
      ref_json      TEXT NOT NULL,     -- JSON: tr\u1ECF t\u1EDBi file/chunk/answer
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
  try {
    db.prepare("ALTER TABLE files ADD COLUMN type TEXT").run();
  } catch (e) {
    if (!e.message.includes("duplicate column")) {
      console.log("Migration check: type column already exists or error", e.message);
    }
  }
  try {
    db.prepare("ALTER TABLE files ADD COLUMN isFavorite INTEGER DEFAULT 0").run();
  } catch (e) {
    if (!e.message.includes("duplicate column")) {
      console.log("Migration check: isFavorite column already exists or error", e.message);
    }
  }
  try {
    db.prepare("ALTER TABLE files ADD COLUMN errorMessage TEXT").run();
  } catch (e) {
    if (!e.message.includes("duplicate column")) {
      console.log("Migration check: errorMessage column already exists or error", e.message);
    }
  }
  try {
    db.prepare("ALTER TABLE chunks ADD COLUMN created_at_ms INTEGER").run();
  } catch (e) {
    if (!e.message.includes("duplicate column")) {
    }
  }
  console.log("Database initialized successfully");
}
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
var import_better_sqlite3, path, import_electron, fs, db;
var init_db = __esm({
  "electron/src/services/storage/db.ts"() {
    "use strict";
    import_better_sqlite3 = __toESM(require("better-sqlite3"));
    path = __toESM(require("path"));
    import_electron = require("electron");
    fs = __toESM(require("fs"));
    db = null;
  }
});

// electron/src/services/storage/repositories/files.repo.ts
var import_uuid, filesRepo;
var init_files_repo = __esm({
  "electron/src/services/storage/repositories/files.repo.ts"() {
    "use strict";
    init_db();
    import_uuid = require("uuid");
    filesRepo = {
      create: (file) => {
        const db2 = getDb();
        const id = (0, import_uuid.v4)();
        const stmt = db2.prepare(`
      INSERT INTO files (id, path, sourceId, name, extension, type, size, mtime, indexedAt, status, hash, isFavorite, errorMessage)
      VALUES (@id, @path, @sourceId, @name, @extension, @type, @size, @mtime, @indexedAt, @status, @hash, 0, NULL)
    `);
        stmt.run({ ...file, id });
        return id;
      },
      getByPath: (path9) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM files WHERE path = ?");
        return stmt.get(path9);
      },
      getById: (id) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM files WHERE id = ?");
        return stmt.get(id);
      },
      updateStatus: (id, status, indexedAt = Date.now(), errorMessage) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE files SET status = ?, indexedAt = ?, errorMessage = ? WHERE id = ?");
        stmt.run(status, indexedAt, errorMessage || null, id);
      },
      updateHash: (id, hash) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE files SET hash = ? WHERE id = ?");
        stmt.run(hash, id);
      },
      delete: (id) => {
        const db2 = getDb();
        const stmt = db2.prepare("DELETE FROM files WHERE id = ?");
        stmt.run(id);
      },
      deleteBySourceId: (sourceId) => {
        const db2 = getDb();
        const stmt = db2.prepare("DELETE FROM files WHERE sourceId = ?");
        stmt.run(sourceId);
      },
      getAll: () => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM files ORDER BY mtime DESC");
        return stmt.all();
      },
      list: (options = {}) => {
        const db2 = getDb();
        let query = "SELECT * FROM files WHERE 1=1";
        const params = [];
        if (options.sourceId) {
          query += " AND sourceId = ?";
          params.push(options.sourceId);
        }
        if (options.status) {
          query += " AND status = ?";
          params.push(options.status);
        }
        if (options.type) {
          query += " AND type = ?";
          params.push(options.type);
        }
        if (options.favoritesOnly) {
          query += " AND isFavorite = 1";
        }
        if (options.search) {
          query += " AND (name LIKE ? OR path LIKE ?)";
          const searchPattern = `%${options.search}%`;
          params.push(searchPattern, searchPattern);
        }
        query += " ORDER BY mtime DESC";
        if (options.limit) {
          query += " LIMIT ?";
          params.push(options.limit);
          if (options.offset) {
            query += " OFFSET ?";
            params.push(options.offset);
          }
        }
        const stmt = db2.prepare(query);
        return stmt.all(...params);
      },
      countBySourceId: (sourceId) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT COUNT(*) as count FROM files WHERE sourceId = ?");
        const result = stmt.get(sourceId);
        return result.count;
      },
      countByStatus: (sourceId, status) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT COUNT(*) as count FROM files WHERE sourceId = ? AND status = ?");
        const result = stmt.get(sourceId, status);
        return result.count;
      },
      toggleFavorite: (id) => {
        const db2 = getDb();
        const file = filesRepo.getById(id);
        if (!file)
          return false;
        const newValue = file.isFavorite ? 0 : 1;
        const stmt = db2.prepare("UPDATE files SET isFavorite = ? WHERE id = ?");
        stmt.run(newValue, id);
        return newValue === 1;
      },
      setFavorite: (id, isFavorite) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE files SET isFavorite = ? WHERE id = ?");
        stmt.run(isFavorite ? 1 : 0, id);
      },
      getBySourceId: (sourceId) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM files WHERE sourceId = ? ORDER BY path ASC");
        return stmt.all(sourceId);
      },
      // Get distinct folders from file paths for a source
      getDistinctFolders: (sourceId) => {
        const db2 = getDb();
        let query = "SELECT DISTINCT path FROM files";
        const params = [];
        if (sourceId) {
          query += " WHERE sourceId = ?";
          params.push(sourceId);
        }
        const stmt = db2.prepare(query);
        const rows = stmt.all(...params);
        const folderSet = /* @__PURE__ */ new Set();
        rows.forEach((row) => {
          const parts = row.path.split(/[/\\]/);
          parts.pop();
          if (parts.length > 0) {
            folderSet.add(parts.join("/"));
          }
        });
        return Array.from(folderSet).sort();
      }
    };
  }
});

// electron/src/services/storage/repositories/jobs.repo.ts
var import_uuid2, jobsRepo;
var init_jobs_repo = __esm({
  "electron/src/services/storage/repositories/jobs.repo.ts"() {
    "use strict";
    init_db();
    import_uuid2 = require("uuid");
    jobsRepo = {
      create: (job) => {
        const db2 = getDb();
        const id = (0, import_uuid2.v4)();
        const createdAt = Date.now();
        const stmt = db2.prepare(`
      INSERT INTO jobs (id, type, status, payloadJson, error, createdAt)
      VALUES (@id, @type, 'pending', @payloadJson, NULL, @createdAt)
    `);
        stmt.run({ ...job, id, createdAt });
        return id;
      },
      createBatch: (jobs) => {
        const db2 = getDb();
        const insert = db2.prepare(`
      INSERT INTO jobs (id, type, status, payloadJson, error, createdAt)
      VALUES (@id, @type, 'pending', @payloadJson, NULL, @createdAt)
    `);
        const insertMany = db2.transaction((jobsList) => {
          for (const job of jobsList) {
            insert.run({
              id: (0, import_uuid2.v4)(),
              type: job.type,
              payloadJson: job.payloadJson,
              createdAt: Date.now()
            });
          }
        });
        insertMany(jobs);
      },
      getNextJob: () => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM jobs WHERE status = ? ORDER BY createdAt ASC LIMIT 1");
        return stmt.get("pending");
      },
      updateStatus: (id, status, error) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE jobs SET status = ?, error = ? WHERE id = ?");
        stmt.run(status, error || null, id);
      },
      clearCompleted: () => {
        const db2 = getDb();
        db2.prepare("DELETE FROM jobs WHERE status = 'completed'").run();
      },
      getErrorJobs: () => {
        const db2 = getDb();
        return db2.prepare("SELECT * FROM jobs WHERE status = 'failed'").all();
      },
      resetProcessingJobs: () => {
        const db2 = getDb();
        const result = db2.prepare("UPDATE jobs SET status = 'pending' WHERE status = 'processing'").run();
        return result.changes;
      }
    };
  }
});

// electron/src/utils/fileLogger.ts
function logToFile(message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  let line = `[${timestamp}] ${message}`;
  if (data) {
    try {
      line += ` ${JSON.stringify(data)}`;
    } catch (e) {
      line += ` [Circular/Unserializable]`;
    }
  }
  line += "\n";
  try {
    fs2.appendFileSync(LOG_FILE, line);
  } catch (e) {
    console.error("Failed to write to log file", e);
  }
}
var fs2, path2, LOG_FILE;
var init_fileLogger = __esm({
  "electron/src/utils/fileLogger.ts"() {
    "use strict";
    fs2 = __toESM(require("fs"));
    path2 = __toESM(require("path"));
    LOG_FILE = path2.join(process.cwd(), "logs", "backend-debug.log");
    try {
      const dir = path2.dirname(LOG_FILE);
      if (!fs2.existsSync(dir)) {
        fs2.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error("Failed to create log dir", e);
    }
  }
});

// electron/src/services/storage/repositories/sources.repo.ts
var sources_repo_exports = {};
__export(sources_repo_exports, {
  sourcesRepo: () => sourcesRepo
});
var import_uuid3, sourcesRepo;
var init_sources_repo = __esm({
  "electron/src/services/storage/repositories/sources.repo.ts"() {
    "use strict";
    init_db();
    import_uuid3 = require("uuid");
    sourcesRepo = {
      create: (input) => {
        const db2 = getDb();
        const id = (0, import_uuid3.v4)();
        const now = Date.now();
        const stmt = db2.prepare(`
      INSERT INTO sources (id, name, path, type, status, totalFiles, indexedFiles, failedFiles, lastUpdate, includeTypes, excludePatterns, createdAt)
      VALUES (@id, @name, @path, @type, @status, @totalFiles, @indexedFiles, @failedFiles, @lastUpdate, @includeTypes, @excludePatterns, @createdAt)
    `);
        const record = {
          id,
          name: input.name,
          path: input.path,
          type: input.type || "folder",
          status: "pending",
          totalFiles: 0,
          indexedFiles: 0,
          failedFiles: 0,
          lastUpdate: now,
          includeTypes: input.includeTypes ? JSON.stringify(input.includeTypes) : null,
          excludePatterns: input.excludePatterns ? JSON.stringify(input.excludePatterns) : null,
          createdAt: now
        };
        stmt.run(record);
        return record;
      },
      getById: (id) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM sources WHERE id = ?");
        return stmt.get(id);
      },
      getByPath: (path9) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM sources WHERE path = ?");
        return stmt.get(path9);
      },
      getAll: () => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM sources ORDER BY createdAt DESC");
        return stmt.all();
      },
      updateStatus: (id, status) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE sources SET status = ?, lastUpdate = ? WHERE id = ?");
        stmt.run(status, Date.now(), id);
      },
      updateStats: (id, stats) => {
        const db2 = getDb();
        const updates = [];
        const values = [];
        if (stats.totalFiles !== void 0) {
          updates.push("totalFiles = ?");
          values.push(stats.totalFiles);
        }
        if (stats.indexedFiles !== void 0) {
          updates.push("indexedFiles = ?");
          values.push(stats.indexedFiles);
        }
        if (stats.failedFiles !== void 0) {
          updates.push("failedFiles = ?");
          values.push(stats.failedFiles);
        }
        updates.push("lastUpdate = ?");
        values.push(Date.now());
        values.push(id);
        const stmt = db2.prepare(`UPDATE sources SET ${updates.join(", ")} WHERE id = ?`);
        stmt.run(...values);
      },
      incrementIndexedFiles: (id) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE sources SET indexedFiles = indexedFiles + 1, lastUpdate = ? WHERE id = ?");
        stmt.run(Date.now(), id);
      },
      incrementFailedFiles: (id) => {
        const db2 = getDb();
        const stmt = db2.prepare("UPDATE sources SET failedFiles = failedFiles + 1, lastUpdate = ? WHERE id = ?");
        stmt.run(Date.now(), id);
      },
      delete: (id) => {
        const db2 = getDb();
        const stmt = db2.prepare("DELETE FROM sources WHERE id = ?");
        stmt.run(id);
      },
      // Error management
      addError: (sourceId, filePath, message) => {
        const db2 = getDb();
        const id = (0, import_uuid3.v4)();
        const stmt = db2.prepare(`
      INSERT INTO source_errors (id, sourceId, filePath, message, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(id, sourceId, filePath, message, Date.now());
        return id;
      },
      getErrors: (sourceId) => {
        const db2 = getDb();
        const stmt = db2.prepare("SELECT * FROM source_errors WHERE sourceId = ? ORDER BY createdAt DESC");
        return stmt.all(sourceId);
      },
      clearErrors: (sourceId) => {
        const db2 = getDb();
        const stmt = db2.prepare("DELETE FROM source_errors WHERE sourceId = ?");
        stmt.run(sourceId);
      },
      deleteError: (errorId) => {
        const db2 = getDb();
        const stmt = db2.prepare("DELETE FROM source_errors WHERE id = ?");
        stmt.run(errorId);
      },
      // Get file type stats for a source
      getFileTypeStats: (sourceId) => {
        const db2 = getDb();
        const stmt = db2.prepare(`
      SELECT extension, COUNT(*) as count 
      FROM files 
      WHERE sourceId = ? 
      GROUP BY extension
    `);
        const rows = stmt.all(sourceId);
        const stats = {};
        rows.forEach((row) => {
          if (row.extension) {
            stats[row.extension] = row.count;
          }
        });
        return stats;
      }
    };
  }
});

// electron/src/services/indexing/scanner.ts
var scanner_exports = {};
__export(scanner_exports, {
  FileScanner: () => FileScanner,
  fileScanner: () => fileScanner
});
var path3, fs3, import_events, FileScanner, fileScanner;
var init_scanner = __esm({
  "electron/src/services/indexing/scanner.ts"() {
    "use strict";
    path3 = __toESM(require("path"));
    fs3 = __toESM(require("fs"));
    import_events = require("events");
    init_files_repo();
    init_jobs_repo();
    init_fileLogger();
    FileScanner = class extends import_events.EventEmitter {
      // ...
      async scanSource(sourceId, sourcePath, options = {}) {
        console.log(`[FileScanner] Scanning source: ${sourcePath} (${sourceId})`);
        logToFile(`[FileScanner] Scanning source: ${sourcePath}`);
        try {
          if (!fs3.existsSync(sourcePath)) {
            console.error(`[FileScanner] Source path not found: ${sourcePath}`);
            return;
          }
          const diskFiles = await this.recursiveScan(sourcePath, options.exclude);
          const diskFileMap = /* @__PURE__ */ new Map();
          diskFiles.forEach((f) => diskFileMap.set(f.path, { size: f.size, mtime: f.mtime }));
          const dbFiles = filesRepo.getBySourceId(sourceId);
          const dbFileMap = /* @__PURE__ */ new Map();
          dbFiles.forEach((f) => dbFileMap.set(f.path, f));
          const jobsToCreate = [];
          const newFilesToInsert = [];
          let validFileCount = 0;
          for (const [filePath, stats] of diskFileMap) {
            const ext = path3.extname(filePath).toLowerCase();
            if (options.include && options.include.length > 0) {
              if (!options.include.includes(ext))
                continue;
            } else {
              const defaultExts = [".md", ".txt", ".pdf", ".py", ".js", ".ts", ".json", ".html", ".css", ".java", ".cpp", ".c", ".h", ".vue"];
              if (!defaultExts.includes(ext))
                continue;
            }
            validFileCount++;
            const dbFile = dbFileMap.get(filePath);
            if (!dbFile) {
              let type = "doc";
              if ([".js", ".ts", ".py", ".java", ".cpp", ".c", ".h", ".json", ".html", ".css", ".vue"].includes(ext)) {
                type = "code";
              } else if ([".pdf"].includes(ext)) {
                type = "pdf";
              }
              const fileId = filesRepo.create({
                path: filePath,
                name: path3.basename(filePath),
                extension: ext,
                type,
                sourceId,
                size: stats.size,
                mtime: stats.mtime,
                indexedAt: 0,
                status: "pending",
                hash: null
              });
              jobsToCreate.push({
                type: "INDEX_FILE",
                payloadJson: JSON.stringify({ fileId, filePath, sourceId })
              });
            } else {
              if (Math.abs(dbFile.mtime - stats.mtime) > 1e3 || dbFile.size !== stats.size || dbFile.status === "error") {
                jobsToCreate.push({
                  type: "INDEX_FILE",
                  payloadJson: JSON.stringify({ fileId: dbFile.id, filePath, sourceId })
                });
                filesRepo.updateStatus(dbFile.id, "pending");
              }
            }
          }
          console.log(`[FileScanner] Found ${validFileCount} valid files for source ${sourceId}`);
          const { sourcesRepo: sourcesRepo2 } = (init_sources_repo(), __toCommonJS(sources_repo_exports));
          sourcesRepo2.updateStats(sourceId, { totalFiles: validFileCount });
          for (const [filePath, dbFile] of dbFileMap) {
            if (!diskFileMap.has(filePath)) {
              jobsToCreate.push({
                type: "DELETE_FILE",
                payloadJson: JSON.stringify({ fileId: dbFile.id, filePath, sourceId })
              });
            }
          }
          if (jobsToCreate.length > 0) {
            console.log(`[FileScanner] Creating ${jobsToCreate.length} jobs for source ${sourceId}`);
            logToFile(`[FileScanner] Creating ${jobsToCreate.length} jobs`);
            jobsRepo.createBatch(jobsToCreate);
          } else {
            console.log(`[FileScanner] No changes detected for source ${sourceId}`);
            logToFile(`[FileScanner] No changes detected`);
          }
        } catch (err) {
          console.error(`[FileScanner] Error scanning source ${sourceId}:`, err);
          logToFile(`[FileScanner] Error: ${err.message}`);
        }
      }
      async recursiveScan(dir, excludePatterns = []) {
        let results = [];
        const systemExcludes = ["node_modules", ".git", "dist", "build", "coverage", "__pycache__"];
        const allExcludes = [...systemExcludes, ...excludePatterns];
        try {
          const entries = await fs3.promises.readdir(dir, { withFileTypes: true });
          console.log(`[Scanner] Reading dir: ${dir}, entries found: ${entries.length}`);
          for (const entry of entries) {
            const resPath = path3.resolve(dir, entry.name);
            if (allExcludes.some((pattern) => resPath.includes(pattern))) {
              continue;
            }
            if (entry.isDirectory()) {
              const subResults = await this.recursiveScan(resPath, excludePatterns);
              results = results.concat(subResults);
            } else {
              try {
                const stats = await fs3.promises.stat(resPath);
                if (stats.size > 10 * 1024 * 1024)
                  continue;
                results.push({
                  path: resPath,
                  size: stats.size,
                  mtime: stats.mtimeMs
                });
              } catch (e) {
              }
            }
          }
        } catch (e) {
          console.error(`Error reading dir ${dir}:`, e);
        }
        return results;
      }
    };
    fileScanner = new FileScanner();
  }
});

// electron/src/services/storage/repositories/chunks.repo.ts
var chunksRepo;
var init_chunks_repo = __esm({
  "electron/src/services/storage/repositories/chunks.repo.ts"() {
    "use strict";
    init_db();
    chunksRepo = {
      insertBatch: (chunks) => {
        const db2 = getDb();
        const insert = db2.prepare(`
      INSERT INTO chunks (id, fileId, chunkIndex, startOffset, endOffset, text)
      VALUES (@id, @fileId, @chunkIndex, @startOffset, @endOffset, @text)
    `);
        const insertMany = db2.transaction((chunks2) => {
          for (const chunk of chunks2) {
            const deterministicId = `${chunk.fileId}_${chunk.chunkIndex}`;
            insert.run({ ...chunk, id: deterministicId });
          }
        });
        insertMany(chunks);
      },
      deleteByFileId: (fileId) => {
        const db2 = getDb();
        const stmt = db2.prepare("DELETE FROM chunks WHERE fileId = ?");
        stmt.run(fileId);
      },
      searchKeyword: (query, filters = {}, limit = 20) => {
        const db2 = getDb();
        let sql = `
      SELECT 
        c.id as chunkId,
        c.text,
        c.startOffset,
        c.endOffset,
        files.id as fileId,
        files.path,
        files.name,
        files.extension,
        files.sourceId,
        files.type,
        files.mtime,
        bm25(chunks_fts) as score,
        snippet(chunks_fts, 0, '<b>', '</b>', '...', 20) as snippet
      FROM chunks_fts 
      JOIN chunks c ON chunks_fts.rowid = c.rowid
      JOIN files ON c.fileId = files.id
      WHERE chunks_fts MATCH @query
    `;
        const params = { query };
        if (filters.sourceId) {
          sql += ` AND files.sourceId = @sourceId`;
          params.sourceId = filters.sourceId;
        }
        if (filters.type && filters.type !== "all") {
          sql += ` AND files.type = @type`;
          params.type = filters.type;
        }
        if (filters.fromMtime) {
          sql += ` AND files.mtime >= @fromMtime`;
          params.fromMtime = filters.fromMtime;
        }
        if (filters.toMtime) {
          sql += ` AND files.mtime <= @toMtime`;
          params.toMtime = filters.toMtime;
        }
        sql += ` ORDER BY score ASC LIMIT @limit`;
        params.limit = limit;
        try {
          return db2.prepare(sql).all(params);
        } catch (e) {
          console.error("FTS Search Error", e);
          return [];
        }
      }
    };
  }
});

// electron/src/services/search/pythonClient.ts
var PYTHON_API_URL2, pythonClient;
var init_pythonClient = __esm({
  "electron/src/services/search/pythonClient.ts"() {
    "use strict";
    PYTHON_API_URL2 = "http://127.0.0.1:8000";
    pythonClient = {
      async indexChunks(chunks) {
        try {
          console.log(`[PythonClient] Sending ${chunks.length} chunks to ${PYTHON_API_URL2}/index`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1e4);
          const response = await fetch(`${PYTHON_API_URL2}/index`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chunks }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Python indexing failed: ${text}`);
          }
          const res = await response.json();
          console.log(`[PythonClient] Success: Indexed ${res.indexed_count} chunks`);
        } catch (err) {
          console.error("[PythonClient] Failed to send chunks to Python:", err);
          throw err;
        }
      },
      async search(query, filters, topK = 20) {
        try {
          const body = {
            query,
            top_k: topK,
            filters
          };
          const response = await fetch(`${PYTHON_API_URL2}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Python search failed: ${text}`);
          }
          const data = await response.json();
          return data.hits;
        } catch (err) {
          console.error("Python search error:", err);
          return [];
        }
      }
    };
  }
});

// electron/src/services/search/searchService.ts
var searchService;
var init_searchService = __esm({
  "electron/src/services/search/searchService.ts"() {
    "use strict";
    init_chunks_repo();
    init_pythonClient();
    init_files_repo();
    searchService = {
      async search(query, options = { mode: "hybrid" }) {
        const startTime = Date.now();
        const topK = options.topK || 20;
        const mode = options.mode;
        let results = [];
        console.log("[SearchService] Search called with query:", `"${query}"`, "Mode:", options?.mode);
        if (!query || !query.trim()) {
          console.log("[SearchService] Empty query detected. Fetching default files.");
          const sourceId = options.filters?.source === "all" ? void 0 : options.filters?.source;
          const type = options.filters?.type === "all" ? void 0 : options.filters?.type;
          const files = filesRepo.list({
            sourceId,
            type,
            limit: topK
          });
          console.log(`[SearchService] Found ${files.length} default files.`);
          results = files.map((f) => ({
            id: f.id,
            fileId: f.id,
            chunkId: void 0,
            title: f.name,
            path: f.path,
            snippet: "",
            score: 1,
            matchType: "keyword",
            sourceId: f.sourceId || void 0
          }));
          return {
            results,
            stats: {
              time: Date.now() - startTime,
              total: results.length
              // This is just page limit, proper total needed? For defaults, page limit is fine.
            }
          };
        }
        let kwResults = [];
        if (mode === "keyword" || mode === "hybrid") {
          kwResults = chunksRepo.searchKeyword(query, topK);
        }
        let semResults = [];
        if (mode === "semantic" || mode === "hybrid") {
          semResults = await pythonClient.search(query, void 0, topK);
        }
        if (mode === "keyword") {
          results = this.mapKwResults(kwResults);
        } else if (mode === "semantic") {
          results = await this.mapSemResults(semResults);
        } else {
          results = await this.mergeHybrid(kwResults, semResults, topK);
        }
        return {
          results,
          stats: {
            time: Date.now() - startTime,
            total: results.length
            // This is limited by TopK/ranking.
          }
        };
      },
      mapKwResults(kwResults) {
        return kwResults.map((r) => ({
          id: r.chunkId,
          fileId: r.fileId,
          chunkId: r.chunkId,
          title: r.name,
          path: r.path,
          snippet: r.text,
          // TODO: generate snippet
          score: r.score,
          // bm25 raw score, might need norm
          matchType: "keyword",
          sourceId: r.sourceId
        }));
      },
      async mapSemResults(semResults) {
        const results = [];
        for (const r of semResults) {
          const fileId = r.metadata.fileId;
          const file = filesRepo.getById(fileId);
          if (file) {
            results.push({
              id: `sem-${r.id}`,
              fileId: file.id,
              chunkId: `sem-${r.id}`,
              // pseudo ID
              title: file.name,
              path: file.path,
              snippet: "Semantic match...",
              // We need text from DB ideally
              score: r.score,
              matchType: "semantic",
              sourceId: file.sourceId || void 0
            });
          }
        }
        return results;
      },
      async mergeHybrid(kwResults, semResults, limit) {
        const k = 60;
        const scores = /* @__PURE__ */ new Map();
        const itemMap = /* @__PURE__ */ new Map();
        kwResults.forEach((r, idx) => {
          const key = r.chunkId;
          const rrfScore = 1 / (k + idx + 1);
          scores.set(key, (scores.get(key) || 0) + rrfScore);
          itemMap.set(key, {
            ...r,
            matchType: "keyword"
            // Keep original score for debug if needed, but RRF overrides it
          });
        });
        for (let i = 0; i < semResults.length; i++) {
          const r = semResults[i];
          const key = r.chunk_id;
          const rrfScore = 1 / (k + i + 1);
          const existingScore = scores.get(key) || 0;
          scores.set(key, existingScore + rrfScore);
          const existingItem = itemMap.get(key);
          if (existingItem) {
            existingItem.matchType = "hybrid";
          } else {
            itemMap.set(key, {
              id: key,
              fileId: r.file_id || r.payload?.file_id,
              chunkId: key,
              title: r.payload?.title || "Unknown",
              path: r.payload?.path || "Unknown",
              snippet: r.snippet || r.payload?.snippet || "",
              score: 0,
              // placeholder
              matchType: "semantic",
              sourceId: r.payload?.source_id,
              tags: r.payload?.tags
            });
          }
        }
        const merged = [];
        for (const [key, score] of scores) {
          const item = itemMap.get(key);
          if (item) {
            merged.push({
              id: key,
              fileId: item.fileId,
              chunkId: key,
              title: item.title,
              path: item.path,
              snippet: item.snippet,
              score,
              matchType: item.matchType,
              sourceId: item.sourceId,
              tags: item.tags
            });
          }
        }
        merged.sort((a, b) => b.score - a.score);
        return merged.slice(0, limit);
      }
    };
  }
});

// electron/src/ipc/handlers/search.handlers.ts
var search_handlers_exports = {};
var import_electron4;
var init_search_handlers = __esm({
  "electron/src/ipc/handlers/search.handlers.ts"() {
    "use strict";
    import_electron4 = require("electron");
    init_searchService();
    init_files_repo();
    import_electron4.ipcMain.handle("search:query", async (event, { query, options }) => {
      try {
        console.log("[search:query] Request:", query, options);
        const { results, stats } = await searchService.search(query, options);
        return { success: true, results, stats };
      } catch (err) {
        console.error("[search:query] Error:", err);
        return { success: false, error: err.message || "Search failed" };
      }
    });
    import_electron4.ipcMain.handle("search:openFile", async (event, filePath) => {
      console.log("Opening file:", filePath);
      try {
        await import_electron4.shell.openPath(filePath);
        return { success: true, message: `Opened ${filePath}` };
      } catch (err) {
        console.error("Failed to open file:", err);
        return { success: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("search:addFavorite", async (event, item) => {
      console.log("Adding to favorites:", item);
      const { v4: uuidv45 } = require("uuid");
      const { getDb: getDb2 } = (init_db(), __toCommonJS(db_exports));
      try {
        const db2 = getDb2();
        const id = uuidv45();
        db2.prepare("INSERT INTO favorites (id, type, refJson, createdAt) VALUES (?, ?, ?, ?)").run(
          id,
          item.type || "SNIPPET",
          // DOCUMENT|SNIPPET|ANSWER
          JSON.stringify(item),
          Date.now()
        );
        return { success: true };
      } catch (err) {
        console.error("Failed to add favorite:", err);
        return { success: false, error: err.message };
      }
    });
    import_electron4.ipcMain.handle("search:sendToAsk", async (event, { query, context }) => {
      console.log("Sending to Ask:", query, context);
      return { success: true };
    });
    import_electron4.ipcMain.handle("search:getPreview", async (event, { fileId, chunkId }) => {
      try {
        const file = filesRepo.getById(fileId);
        if (!file)
          throw new Error("File not found");
        const { getDb: getDb2 } = (init_db(), __toCommonJS(db_exports));
        const db2 = getDb2();
        let chunk;
        if (chunkId && chunkId.includes("_")) {
          const parts = chunkId.split("_");
          if (parts.length >= 2) {
            const index = parseInt(parts[parts.length - 1]);
            if (!isNaN(index)) {
              chunk = db2.prepare("SELECT * FROM chunks WHERE fileId = ? AND chunkIndex = ?").get(fileId, index);
            }
          }
        }
        if (!chunk && chunkId) {
          chunk = db2.prepare("SELECT * FROM chunks WHERE id = ?").get(chunkId);
        }
        const content = chunk ? chunk.text : (await require("fs").promises.readFile(file.path, "utf-8")).substring(0, 2e3);
        return {
          success: true,
          data: {
            content,
            file,
            chunk
          }
        };
      } catch (err) {
        console.error("Preview error:", err);
        return { success: false, error: err.message };
      }
    });
  }
});

// electron/src/services/storage/repositories/favorites.repo.ts
function mapRowToFavorite(row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title || "",
    // Fallback, though DB allows null, domain expects string usually? Type says string.
    ref: JSON.parse(row.ref_json),
    tags: JSON.parse(row.tags_json || "[]"),
    pinned: Boolean(row.pinned),
    usedCount: row.used_count,
    createdAt: row.created_at_ms,
    updatedAt: row.updated_at_ms
  };
}
function listFavorites(filters = {}, sort = "recent") {
  const db2 = getDb();
  let query = "SELECT * FROM favorites WHERE 1=1";
  const params = [];
  if (filters.kind && filters.kind !== "all") {
    query += " AND kind = ?";
    params.push(filters.kind);
  }
  if (filters.pinned !== void 0) {
    query += " AND pinned = ?";
    params.push(filters.pinned ? 1 : 0);
  }
  if (filters.search) {
    query += " AND (title LIKE ? OR tags_json LIKE ?)";
    const term = `%${filters.search}%`;
    params.push(term, term);
  }
  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map((t) => "tags_json LIKE ?").join(" OR ");
    query += ` AND (${tagConditions})`;
    filters.tags.forEach((t) => params.push(`%"${t}"%`));
  }
  switch (sort) {
    case "recent":
      query += " ORDER BY created_at_ms DESC";
      break;
    case "used":
      query += " ORDER BY used_count DESC";
      break;
    case "title":
      query += " ORDER BY title ASC";
      break;
    case "kind":
      query += " ORDER BY kind ASC, created_at_ms DESC";
      break;
    default:
      query += " ORDER BY created_at_ms DESC";
  }
  if (sort !== "recent") {
    query = query.replace("ORDER BY", "ORDER BY pinned DESC,");
  } else {
    query = query.replace("ORDER BY", "ORDER BY pinned DESC,");
  }
  const rows = db2.prepare(query).all(...params);
  const fileIds = /* @__PURE__ */ new Set();
  rows.forEach((row) => {
    try {
      const ref = JSON.parse(row.ref_json);
      if (row.kind === "DOCUMENT" || row.kind === "SNIPPET") {
        if (ref.fileId)
          fileIds.add(ref.fileId);
      }
    } catch (e) {
    }
  });
  const filePaths = {};
  if (fileIds.size > 0) {
    const ids = Array.from(fileIds);
    const placeholders = ids.map(() => "?").join(",");
    const files = db2.prepare(`SELECT id, path FROM files WHERE id IN (${placeholders})`).all(...ids);
    files.forEach((f) => filePaths[f.id] = f.path);
  }
  return rows.map((row) => {
    const fav = mapRowToFavorite(row);
    if (fav.kind === "DOCUMENT" || fav.kind === "SNIPPET") {
      const fRef = fav.ref;
      if (fRef.fileId && filePaths[fRef.fileId]) {
        fav.filePath = filePaths[fRef.fileId];
      }
    }
    return fav;
  });
}
function addFavorite(payload) {
  const db2 = getDb();
  const id = (0, import_uuid4.v4)();
  const now = Date.now();
  const row = {
    id,
    kind: payload.kind,
    title: payload.title || payload.ref.title || "Untitled",
    // Try to get title from ref if missing
    ref_json: JSON.stringify(payload.ref),
    tags_json: JSON.stringify(payload.tags || []),
    pinned: 0,
    created_at_ms: now,
    updated_at_ms: now,
    used_count: 0
  };
  const stmt = db2.prepare(`
        INSERT INTO favorites (
            id, kind, title, ref_json, tags_json, pinned, created_at_ms, updated_at_ms, used_count
        ) VALUES (
            @id, @kind, @title, @ref_json, @tags_json, @pinned, @created_at_ms, @updated_at_ms, @used_count
        )
    `);
  stmt.run(row);
  return mapRowToFavorite(row);
}
function updateFavorite(id, patch) {
  const db2 = getDb();
  const updates = [];
  const params = { id };
  updates.push("updated_at_ms = @updated_at_ms");
  params.updated_at_ms = Date.now();
  if (patch.title !== void 0) {
    updates.push("title = @title");
    params.title = patch.title;
  }
  if (patch.tags !== void 0) {
    updates.push("tags_json = @tags_json");
    params.tags_json = JSON.stringify(patch.tags);
  }
  if (patch.pinned !== void 0) {
    updates.push("pinned = @pinned");
    params.pinned = patch.pinned ? 1 : 0;
  }
  const stmt = db2.prepare(`
        UPDATE favorites 
        SET ${updates.join(", ")}
        WHERE id = @id
    `);
  const info = stmt.run(params);
  if (info.changes > 0) {
    return getFavorite(id);
  }
  return null;
}
function removeFavorite(id) {
  const db2 = getDb();
  const info = db2.prepare("DELETE FROM favorites WHERE id = ?").run(id);
  return info.changes > 0;
}
function getFavorite(id) {
  const db2 = getDb();
  const row = db2.prepare("SELECT * FROM favorites WHERE id = ?").get(id);
  if (!row)
    return null;
  return mapRowToFavorite(row);
}
function incrementUsedCount(id) {
  const db2 = getDb();
  db2.prepare(`
        UPDATE favorites 
        SET used_count = used_count + 1, updated_at_ms = ?
        WHERE id = ?
    `).run(Date.now(), id);
}
function listFolders() {
  return [];
}
function createFolder(name, icon) {
  throw new Error("Folders not implemented in MVP DB");
}
function deleteFolder(id) {
  return false;
}
function getAllTags() {
  const db2 = getDb();
  const rows = db2.prepare("SELECT tags_json FROM favorites").all();
  const allTags = /* @__PURE__ */ new Set();
  rows.forEach((row) => {
    try {
      const tags = JSON.parse(row.tags_json);
      if (Array.isArray(tags)) {
        tags.forEach((t) => allTags.add(String(t)));
      }
    } catch (e) {
    }
  });
  return Array.from(allTags).sort();
}
function getTagCounts() {
  const db2 = getDb();
  const rows = db2.prepare("SELECT tags_json FROM favorites").all();
  const counts = {};
  rows.forEach((row) => {
    try {
      const tags = JSON.parse(row.tags_json);
      if (Array.isArray(tags)) {
        tags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    } catch (e) {
    }
  });
  return counts;
}
var import_uuid4;
var init_favorites_repo = __esm({
  "electron/src/services/storage/repositories/favorites.repo.ts"() {
    "use strict";
    init_db();
    import_uuid4 = require("uuid");
  }
});

// electron/src/ipc/handlers/favorites.handlers.ts
var favorites_handlers_exports = {};
var import_electron5, fs4;
var init_favorites_handlers = __esm({
  "electron/src/ipc/handlers/favorites.handlers.ts"() {
    "use strict";
    import_electron5 = require("electron");
    fs4 = __toESM(require("fs"));
    init_favorites_repo();
    init_files_repo();
    import_electron5.ipcMain.handle("favorites:list", async (_event, options) => {
      try {
        const favorites = listFavorites(
          options?.filters || {},
          options?.sort || "recent"
        );
        return { success: true, data: favorites };
      } catch (error) {
        console.error("favorites:list error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:add", async (_event, payload) => {
      try {
        const favorite = addFavorite(payload);
        return { success: true, data: favorite };
      } catch (error) {
        console.error("favorites:add error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:update", async (_event, { id, patch }) => {
      try {
        const favorite = updateFavorite(id, patch);
        if (!favorite) {
          return { success: false, error: "Favorite not found" };
        }
        return { success: true, data: favorite };
      } catch (error) {
        console.error("favorites:update error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:remove", async (_event, id) => {
      try {
        const removed = removeFavorite(id);
        return { success: removed, error: removed ? null : "Favorite not found" };
      } catch (error) {
        console.error("favorites:remove error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:open", async (_event, id) => {
      try {
        const favorite = getFavorite(id);
        if (!favorite) {
          return { success: false, error: "Favorite not found" };
        }
        incrementUsedCount(id);
        switch (favorite.kind) {
          case "DOCUMENT": {
            const ref = favorite.ref;
            if (!ref.fileId)
              throw new Error("Invalid document reference");
            const file = filesRepo.getById(ref.fileId);
            if (!file)
              throw new Error("File not found in index");
            if (!fs4.existsSync(file.path)) {
              throw new Error("File not found on disk (missing)");
            }
            await import_electron5.shell.openPath(file.path);
            return { success: true, data: { ...favorite, filePath: file.path } };
          }
          case "SNIPPET": {
            const ref = favorite.ref;
            if (!ref.fileId)
              throw new Error("Invalid snippet reference");
            const file = filesRepo.getById(ref.fileId);
            if (!file)
              throw new Error("File not found in index");
            if (!fs4.existsSync(file.path)) {
              throw new Error("File not found on disk (missing)");
            }
            await import_electron5.shell.openPath(file.path);
            return { success: true, data: { ...favorite, filePath: file.path } };
          }
          case "ANSWER": {
            return { success: true, data: favorite };
          }
          default:
            return { success: false, error: "Unknown favorite type" };
        }
      } catch (error) {
        console.error("favorites:open error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:tags", async (_event) => {
      try {
        const tags = getAllTags();
        const counts = getTagCounts();
        return { success: true, data: { tags, counts } };
      } catch (error) {
        console.error("favorites:tags error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:folders:list", async (_event) => {
      try {
        const folders = listFolders();
        return { success: true, data: folders };
      } catch (error) {
        console.error("favorites:folders:list error:", error);
        return { success: false, error: error.message };
      }
    });
    import_electron5.ipcMain.handle("favorites:folders:create", async (_event, { name, icon }) => {
      try {
        const folder = createFolder(name, icon);
        return { success: true, data: folder };
      } catch (error) {
        return { success: false, error: "Folders not implemented" };
      }
    });
    import_electron5.ipcMain.handle("favorites:folders:delete", async (_event, id) => {
      try {
        const deleted = deleteFolder(id);
        return { success: deleted, error: deleted ? null : "Folder not found" };
      } catch (error) {
        return { success: false, error: "Folders not implemented" };
      }
    });
  }
});

// electron/src/ipc/handlers/insights.handlers.ts
var insights_handlers_exports = {};
function generateDateRange(range) {
  const dates = [];
  const now = /* @__PURE__ */ new Date();
  let days = 1;
  switch (range) {
    case "today":
      days = 1;
      break;
    case "7days":
      days = 7;
      break;
    case "30days":
      days = 30;
      break;
    default:
      days = 7;
  }
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}
function generateMockUsageData(range) {
  const dates = generateDateRange(range);
  return dates.map((date) => ({
    date,
    searches: Math.floor(Math.random() * 30) + 5,
    askAi: Math.floor(Math.random() * 15) + 2
  }));
}
function generateMockTopDocuments() {
  return [
    { id: "1", name: "Redis_Caching.md", path: "C:/Projects/backend-docs/redis/Redis_Caching.md", accessCount: 42, lastAccessed: "2026-02-03T06:30:00Z" },
    { id: "2", name: "API_Authentication.md", path: "C:/Projects/backend-docs/auth/API_Authentication.md", accessCount: 28, lastAccessed: "2026-02-02T14:20:00Z" },
    { id: "3", name: "database_schema.sql", path: "C:/Projects/backend-docs/database/database_schema.sql", accessCount: 19, lastAccessed: "2026-02-02T10:15:00Z" },
    { id: "4", name: "ML_Research_Paper.pdf", path: "C:/Research/papers/ML_Research_Paper.pdf", accessCount: 15, lastAccessed: "2026-02-01T16:45:00Z" },
    { id: "6", name: "meeting_notes.txt", path: "C:/Notes/project-notes/meeting_notes.txt", accessCount: 11, lastAccessed: "2026-02-03T07:00:00Z" },
    { id: "7", name: "utils.py", path: "C:/Projects/backend-docs/utils/utils.py", accessCount: 8, lastAccessed: "2026-01-30T11:20:00Z" },
    { id: "8", name: "config.json", path: "C:/Projects/backend-docs/config/config.json", accessCount: 5, lastAccessed: "2026-01-29T15:45:00Z" }
  ];
}
function generateMockTopicStats() {
  const topics = [
    { tag: "redis", count: 42 },
    { tag: "backend", count: 38 },
    { tag: "auth", count: 28 },
    { tag: "database", count: 24 },
    { tag: "api", count: 19 },
    { tag: "python", count: 12 },
    { tag: "config", count: 8 }
  ];
  const total = topics.reduce((sum, t) => sum + t.count, 0);
  return topics.map((t) => ({
    ...t,
    percentage: Math.round(t.count / total * 100)
  }));
}
function generateMockSourceStats() {
  return [
    { sourceId: "1", name: "backend-docs", accessCount: 89, documentCount: 5, isActive: true },
    { sourceId: "2", name: "research-papers", accessCount: 17, documentCount: 2, isActive: true },
    { sourceId: "3", name: "project-notes", accessCount: 11, documentCount: 1, isActive: true },
    { sourceId: "4", name: "old-archives", accessCount: 0, documentCount: 12, isActive: false }
  ];
}
function generateMockNoResultQueries() {
  return [
    { id: "1", query: "docker deployment", count: 5, lastAsked: "2026-02-03T08:00:00Z" },
    { id: "2", query: "kubernetes setup", count: 4, lastAsked: "2026-02-02T15:30:00Z" },
    { id: "3", query: "unit testing best practices", count: 3, lastAsked: "2026-02-02T11:00:00Z" },
    { id: "4", query: "CI/CD pipeline", count: 3, lastAsked: "2026-02-01T09:45:00Z" },
    { id: "5", query: "microservices architecture", count: 2, lastAsked: "2026-01-31T14:20:00Z" }
  ];
}
function generateMockKpiSummary(range) {
  const multiplier = range === "today" ? 1 : range === "7days" ? 7 : 30;
  return {
    totalDocuments: 142,
    indexedFiles: 128,
    searchesPerformed: Math.floor(18 * multiplier * (0.8 + Math.random() * 0.4)),
    aiQuestionsAsked: Math.floor(6 * multiplier * (0.8 + Math.random() * 0.4)),
    topUsedDocs: 28,
    noResultSearches: Math.floor(2 * multiplier * (0.8 + Math.random() * 0.4))
  };
}
function generateMockInsights(range) {
  const insights = [
    {
      id: "1",
      type: "info",
      icon: "\u{1F4A1}",
      title: "Top Performer",
      message: 'Your document "Redis_Caching.md" accounts for 32% of all searches. Consider creating related documentation.',
      cta: {
        label: "View document",
        action: "openDocument",
        params: { id: "1" }
      }
    },
    {
      id: "2",
      type: "warning",
      icon: "\u26A0\uFE0F",
      title: "No Results Found",
      message: `${range === "today" ? "5" : range === "7days" ? "17" : "48"} search queries returned no results. Consider adding documentation for these topics.`,
      cta: {
        label: "Review queries",
        action: "showNoResults"
      }
    },
    {
      id: "3",
      type: "danger",
      icon: "\u{1F4C9}",
      title: "Low Usage Alert",
      message: "42 documents have not been accessed in the last 30 days. Consider reviewing or archiving them.",
      cta: {
        label: "Review unused docs",
        action: "filterUnused"
      }
    },
    {
      id: "4",
      type: "success",
      icon: "\u{1F4C8}",
      title: "Usage Growing",
      message: "Search activity increased by 23% compared to the previous period. Your knowledge base is getting more valuable!"
    },
    {
      id: "5",
      type: "info",
      icon: "\u{1F504}",
      title: "Re-index Suggested",
      message: "3 documents have been modified since last indexing. Re-index to ensure search accuracy.",
      cta: {
        label: "Re-index now",
        action: "reindexOutdated"
      }
    }
  ];
  return range === "today" ? insights.slice(0, 3) : insights;
}
var import_electron6;
var init_insights_handlers = __esm({
  "electron/src/ipc/handlers/insights.handlers.ts"() {
    "use strict";
    import_electron6 = require("electron");
    import_electron6.ipcMain.handle("insights:getUsageStats", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 200));
      return generateMockUsageData(range);
    });
    import_electron6.ipcMain.handle("insights:getTopDocuments", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 150));
      return generateMockTopDocuments();
    });
    import_electron6.ipcMain.handle("insights:getTopicStats", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 150));
      return generateMockTopicStats();
    });
    import_electron6.ipcMain.handle("insights:getSourceStats", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 150));
      return generateMockSourceStats();
    });
    import_electron6.ipcMain.handle("insights:getNoResultQueries", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 150));
      return generateMockNoResultQueries();
    });
    import_electron6.ipcMain.handle("insights:getKpiSummary", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 100));
      return generateMockKpiSummary(range);
    });
    import_electron6.ipcMain.handle("insights:getAutoInsights", async (_event, range) => {
      await new Promise((resolve2) => setTimeout(resolve2, 200));
      return generateMockInsights(range);
    });
    console.log("Insights IPC handlers registered");
  }
});

// electron/src/ipc/handlers/documents.handlers.ts
var documents_handlers_exports = {};
function formatSize(bytes) {
  if (bytes < 1024)
    return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function transformFile(record) {
  let sourceName = "Unknown";
  if (record.sourceId) {
    const source = sourcesRepo.getById(record.sourceId);
    if (source) {
      const relativePath = record.path.replace(source.path, "").replace(/^[/\\]/, "");
      const parts = relativePath.split(/[/\\]/);
      parts.pop();
      sourceName = parts.length > 0 ? `${source.name}/${parts.join("/")}` : source.name;
    }
  }
  let type = record.type || "text";
  if (record.extension === ".md")
    type = "markdown";
  else if (record.extension === ".pdf")
    type = "pdf";
  else if (record.extension === ".py")
    type = "python";
  else if ([".js", ".ts", ".jsx", ".tsx"].includes(record.extension))
    type = "code";
  else if (record.extension === ".json")
    type = "json";
  else if (record.extension === ".txt")
    type = "text";
  return {
    id: record.id,
    name: record.name,
    path: record.path,
    source: sourceName,
    sourceId: record.sourceId || "",
    type,
    size: formatSize(record.size),
    sizeBytes: record.size,
    tags: [],
    // TODO: Implement tags from tags table
    isFavorite: record.isFavorite === 1,
    status: record.status,
    lastModified: new Date(record.mtime).toISOString(),
    lastIndexed: new Date(record.indexedAt).toISOString(),
    errorMessage: record.errorMessage || void 0
  };
}
var import_electron7, path4, fs5;
var init_documents_handlers = __esm({
  "electron/src/ipc/handlers/documents.handlers.ts"() {
    "use strict";
    import_electron7 = require("electron");
    path4 = __toESM(require("path"));
    fs5 = __toESM(require("fs"));
    init_files_repo();
    init_sources_repo();
    import_electron7.ipcMain.handle("documents:list", async (_, filters, sort) => {
      try {
        let files = filesRepo.list({
          sourceId: filters?.sourceId,
          search: filters?.searchQuery,
          type: filters?.fileType,
          favoritesOnly: filters?.filterType === "favorites",
          status: filters?.filterType === "failed" ? "error" : void 0
        });
        if (filters?.filterType === "recent") {
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
          files = files.filter((f) => f.indexedAt > oneDayAgo);
        }
        if (filters?.folderId && filters.folderId !== "all") {
          const sources = sourcesRepo.getAll();
          let folderPath = "";
          for (const source of sources) {
            if (filters.folderId === `folder-${source.id}`) {
              folderPath = source.path;
              break;
            }
          }
          if (folderPath) {
            files = files.filter((f) => f.path.startsWith(folderPath));
          }
        }
        if (sort) {
          files.sort((a, b) => {
            let comparison = 0;
            switch (sort.key) {
              case "name":
                comparison = a.name.localeCompare(b.name);
                break;
              case "lastIndexed":
                comparison = a.indexedAt - b.indexedAt;
                break;
              case "lastModified":
                comparison = a.mtime - b.mtime;
                break;
              case "size":
                comparison = a.size - b.size;
                break;
            }
            return sort.order === "desc" ? -comparison : comparison;
          });
        }
        return files.map(transformFile);
      } catch (error) {
        console.error("Failed to list documents:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:getFolderTree", async () => {
      try {
        const sources = sourcesRepo.getAll();
        const totalCount = filesRepo.getAll().length;
        const tree = [{
          id: "all",
          name: "All Documents",
          path: "",
          documentCount: totalCount,
          isExpanded: true,
          children: sources.map((source) => ({
            id: `folder-${source.id}`,
            name: source.name,
            path: source.path,
            documentCount: filesRepo.countBySourceId(source.id),
            isExpanded: false,
            children: []
            // Could add subfolder support later
          }))
        }];
        return tree;
      } catch (error) {
        console.error("Failed to get folder tree:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:getById", async (_, documentId) => {
      try {
        const file = filesRepo.getById(documentId);
        if (!file)
          return null;
        const doc = transformFile(file);
        try {
          if (fs5.existsSync(file.path)) {
            const content = fs5.readFileSync(file.path, "utf-8");
            return { ...doc, content };
          }
        } catch (err) {
          console.warn("Could not read file content:", err);
        }
        return doc;
      } catch (error) {
        console.error("Failed to get document:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:toggleFavorite", async (_, documentId) => {
      try {
        const newValue = filesRepo.toggleFavorite(documentId);
        return newValue;
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:reindex", async (_, documentId) => {
      try {
        filesRepo.updateStatus(documentId, "pending");
        setTimeout(() => {
          filesRepo.updateStatus(documentId, "indexed");
        }, 1e3);
        return true;
      } catch (error) {
        console.error("Failed to reindex document:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:remove", async (_, documentId) => {
      try {
        filesRepo.delete(documentId);
        return true;
      } catch (error) {
        console.error("Failed to remove document:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:reveal", async (_, filePath) => {
      try {
        let targetPath = path4.normalize(filePath);
        console.log("Revealing file in explorer:", targetPath);
        if (!fs5.existsSync(targetPath)) {
          console.warn("File does not exist:", targetPath);
          const dirPath = path4.dirname(targetPath);
          if (fs5.existsSync(dirPath)) {
            await import_electron7.shell.openPath(dirPath);
            return true;
          }
          console.error("Parent directory does not exist either:", dirPath);
          return false;
        }
        await import_electron7.shell.showItemInFolder(targetPath);
        return true;
      } catch (error) {
        console.error("Failed to reveal file:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:open", async (_, filePath) => {
      try {
        console.log("Opening file:", filePath);
        const result = await import_electron7.shell.openPath(filePath);
        if (result) {
          throw new Error(`Failed to open file: ${result}`);
        }
        return true;
      } catch (error) {
        console.error("Failed to open document:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:bulkRemove", async (_, documentIds) => {
      try {
        for (const id of documentIds) {
          filesRepo.delete(id);
        }
        return true;
      } catch (error) {
        console.error("Failed to bulk remove:", error);
        throw error;
      }
    });
    import_electron7.ipcMain.handle("documents:bulkReindex", async (_, documentIds) => {
      try {
        for (const id of documentIds) {
          filesRepo.updateStatus(id, "pending");
        }
        return true;
      } catch (error) {
        console.error("Failed to bulk reindex:", error);
        throw error;
      }
    });
  }
});

// electron/src/ipc/handlers/sources.handlers.ts
var sources_handlers_exports = {};
function formatRelativeTime(timestamp) {
  if (!timestamp)
    return "Never";
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 6e4);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1)
    return "Just now";
  if (minutes < 60)
    return `${minutes}m ago`;
  if (hours < 24)
    return `${hours}h ago`;
  if (days < 7)
    return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
function transformSource(record) {
  const errors = sourcesRepo.getErrors(record.id);
  const fileTypes = sourcesRepo.getFileTypeStats(record.id);
  return {
    id: record.id,
    name: record.name,
    path: record.path,
    type: record.type,
    status: record.status,
    totalFiles: record.totalFiles,
    indexedFiles: record.indexedFiles,
    failedFiles: record.failedFiles,
    lastUpdate: formatRelativeTime(record.lastUpdate),
    fileTypes,
    errors: errors.map((e) => ({ file: e.filePath, message: e.message }))
  };
}
var import_electron8, path5;
var init_sources_handlers = __esm({
  "electron/src/ipc/handlers/sources.handlers.ts"() {
    "use strict";
    import_electron8 = require("electron");
    init_sources_repo();
    init_files_repo();
    path5 = __toESM(require("path"));
    import_electron8.ipcMain.handle("sources:list", async () => {
      try {
        console.log("[sources:list] Getting all sources from DB...");
        const sources = sourcesRepo.getAll();
        console.log("[sources:list] Found", sources.length, "sources");
        const result = sources.map(transformSource);
        console.log("[sources:list] Returning:", result);
        return result;
      } catch (error) {
        console.error("[sources:list] Failed to list sources:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:add", async (_, data) => {
      try {
        console.log("[sources:add] Received data:", data);
        const folderName = data.options.name?.trim() || path5.basename(data.path);
        const existing = sourcesRepo.getByPath(data.path);
        if (existing) {
          throw new Error("Source already exists");
        }
        console.log("[sources:add] Creating source record with name:", folderName);
        const source = sourcesRepo.create({
          name: folderName,
          path: data.path,
          type: "folder",
          includeTypes: data.options.includeTypes,
          excludePatterns: data.options.excludePatterns
        });
        console.log("[sources:add] Source created:", source);
        sourcesRepo.updateStatus(source.id, "indexing");
        const { fileScanner: fileScanner2 } = (init_scanner(), __toCommonJS(scanner_exports));
        fileScanner2.scanSource(source.id, data.path, {
          include: data.options.includeTypes,
          exclude: data.options.excludePatterns
        }).catch((err) => console.error("Scan failed:", err));
        const result = transformSource(sourcesRepo.getById(source.id));
        console.log("[sources:add] Returning:", result);
        return result;
      } catch (error) {
        console.error("[sources:add] Failed to add source:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:remove", async (_, sourceId) => {
      try {
        filesRepo.deleteBySourceId(sourceId);
        sourcesRepo.delete(sourceId);
        return true;
      } catch (error) {
        console.error("Failed to remove source:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:reindex", async (_, sourceId) => {
      try {
        const source = sourcesRepo.getById(sourceId);
        if (!source)
          throw new Error("Source not found");
        sourcesRepo.updateStats(sourceId, { indexedFiles: 0, failedFiles: 0 });
        sourcesRepo.updateStatus(sourceId, "indexing");
        sourcesRepo.clearErrors(sourceId);
        filesRepo.deleteBySourceId(sourceId);
        const includeTypes = source.includeTypes ? JSON.parse(source.includeTypes) : [".md", ".txt", ".pdf", ".py", ".js", ".ts"];
        const excludePatterns = source.excludePatterns ? JSON.parse(source.excludePatterns) : ["node_modules", ".git"];
        const { fileScanner: fileScanner2 } = (init_scanner(), __toCommonJS(scanner_exports));
        fileScanner2.scanSource(sourceId, source.path, { include: includeTypes, exclude: excludePatterns }).catch((err) => console.error("Rescan failed:", err));
        return true;
      } catch (error) {
        console.error("Failed to reindex source:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:pause", async (_, sourceId) => {
      try {
        sourcesRepo.updateStatus(sourceId, "paused");
        return true;
      } catch (error) {
        console.error("Failed to pause source:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:resume", async (_, sourceId) => {
      try {
        const source = sourcesRepo.getById(sourceId);
        if (!source)
          throw new Error("Source not found");
        sourcesRepo.updateStatus(sourceId, "indexing");
        const includeTypes = source.includeTypes ? JSON.parse(source.includeTypes) : [".md", ".txt", ".pdf"];
        const excludePatterns = source.excludePatterns ? JSON.parse(source.excludePatterns) : ["node_modules", ".git"];
        const { fileScanner: fileScanner2 } = (init_scanner(), __toCommonJS(scanner_exports));
        fileScanner2.scanSource(sourceId, source.path, { include: includeTypes, exclude: excludePatterns }).catch((err) => console.error("Resume scan failed:", err));
        return true;
      } catch (error) {
        console.error("Failed to resume source:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:getStatus", async (_, sourceId) => {
      try {
        const source = sourcesRepo.getById(sourceId);
        if (!source)
          throw new Error("Source not found");
        const progress = source.totalFiles > 0 ? Math.round(source.indexedFiles / source.totalFiles * 100) : 0;
        let statusText = "Idle";
        if (source.status === "indexing") {
          statusText = `Indexing (${progress}%)`;
        }
        return {
          sourceId,
          progress,
          currentFile: "",
          // hard to track with async jobs unless we join jobs table
          statusText,
          filesProcessed: source.indexedFiles,
          totalFiles: source.totalFiles
        };
      } catch (error) {
        console.error("Failed to get status:", error);
        throw error;
      }
    });
    import_electron8.ipcMain.handle("sources:retryFailed", async (_, sourceId) => {
      return true;
    });
    import_electron8.ipcMain.handle("dialog:selectFolder", async () => {
      const focusedWindow = import_electron8.BrowserWindow.getFocusedWindow();
      const result = await import_electron8.dialog.showOpenDialog(focusedWindow || void 0, {
        title: "Ch\u1ECDn th\u01B0 m\u1EE5c",
        properties: ["openDirectory"],
        buttonLabel: "Ch\u1ECDn"
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0];
    });
  }
});

// electron/src/services/indexing/textExtractor.ts
async function extractText(filePath) {
  const ext = path6.extname(filePath).toLowerCase();
  try {
    if (ext === ".txt" || ext === ".md" || ext === ".json" || ext === ".ts" || ext === ".js" || ext === ".py") {
      return fs6.promises.readFile(filePath, "utf-8");
    }
    return "";
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    return "";
  }
}
var fs6, path6;
var init_textExtractor = __esm({
  "electron/src/services/indexing/textExtractor.ts"() {
    "use strict";
    fs6 = __toESM(require("fs"));
    path6 = __toESM(require("path"));
  }
});

// electron/src/services/indexing/chunker.ts
function chunkText(text, chunkSize = 1e3, overlap = 100) {
  const chunks = [];
  let start = 0;
  if (!text || text.length === 0) {
    return [];
  }
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      text: text.slice(start, end),
      start,
      end
    });
    if (end === text.length)
      break;
    start += chunkSize - overlap;
  }
  return chunks;
}
var init_chunker = __esm({
  "electron/src/services/indexing/chunker.ts"() {
    "use strict";
  }
});

// electron/src/services/indexing/indexOrchestrator.ts
var path7, fs7, crypto, IndexOrchestrator, indexOrchestrator;
var init_indexOrchestrator = __esm({
  "electron/src/services/indexing/indexOrchestrator.ts"() {
    "use strict";
    init_textExtractor();
    init_chunker();
    init_files_repo();
    init_chunks_repo();
    init_sources_repo();
    init_pythonClient();
    path7 = __toESM(require("path"));
    fs7 = __toESM(require("fs"));
    crypto = __toESM(require("crypto"));
    IndexOrchestrator = class {
      async indexFile(fileId, filePath, sourceId) {
        console.log(`[IndexOrchestrator] Indexing file: ${filePath}`);
        try {
          if (!fs7.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
          }
          const stats = await fs7.promises.stat(filePath);
          const text = await extractText(filePath);
          if (!text || text.trim().length === 0) {
            console.log(`[IndexOrchestrator] No text extracted from ${filePath}. Updating metadata only.`);
            filesRepo.updateStatus(fileId, "indexed");
            sourcesRepo.incrementIndexedFiles(sourceId);
            return;
          }
          const hash = crypto.createHash("sha256").update(text).digest("hex");
          const chunks = chunkText(text);
          chunksRepo.deleteByFileId(fileId);
          const chunksData = chunks.map((c, idx) => ({
            fileId,
            chunkIndex: idx,
            startOffset: c.start,
            endOffset: c.end,
            text: c.text,
            created_at_ms: Date.now()
          }));
          chunksRepo.insertBatch(chunksData);
          const ext = path7.extname(filePath).toLowerCase();
          let type = "doc";
          if ([".js", ".ts", ".py", ".java", ".cpp", ".c", ".h", ".json", ".html", ".css", ".vue"].includes(ext)) {
            type = "code";
          } else if ([".pdf"].includes(ext)) {
            type = "pdf";
          }
          const payloadChunks = chunksData.map((c) => ({
            chunkId: `${c.fileId}_${c.chunkIndex}`,
            text: c.text,
            fileId: c.fileId,
            metadata: {
              file_id: c.fileId,
              source_id: sourceId,
              type,
              // doc, code, pdf
              tags: [],
              mtime_ms: stats.mtimeMs,
              // For display in citations
              file_name: path7.basename(filePath),
              file_path: filePath,
              // Legacy fields (keep for backwards compatibility)
              title: path7.basename(filePath),
              path: filePath,
              snippet: c.text.substring(0, 200),
              // Extended snippet for better context
              text: c.text
              // Full text for RAG context
            }
          }));
          await pythonClient.indexChunks(payloadChunks);
          filesRepo.updateHash(fileId, hash);
          filesRepo.updateStatus(fileId, "indexed", Date.now());
          sourcesRepo.incrementIndexedFiles(sourceId);
          console.log(`[IndexOrchestrator] Successfully indexed ${filePath} (${chunks.length} chunks)`);
        } catch (err) {
          console.error(`[IndexOrchestrator] Error indexing ${filePath}:`, err);
          filesRepo.updateStatus(fileId, "error", Date.now(), err.message);
          sourcesRepo.incrementFailedFiles(sourceId);
          throw err;
        }
      }
      async deleteFile(fileId) {
        console.log(`[IndexOrchestrator] Deleting file: ${fileId}`);
        try {
          filesRepo.delete(fileId);
          console.log(`[IndexOrchestrator] Deleted file record ${fileId}`);
        } catch (err) {
          console.error(`[IndexOrchestrator] Error deleting file ${fileId}:`, err);
          throw err;
        }
      }
    };
    indexOrchestrator = new IndexOrchestrator();
  }
});

// electron/src/services/indexing/jobQueue.ts
var jobQueue_exports = {};
__export(jobQueue_exports, {
  JobQueue: () => JobQueue,
  jobQueue: () => jobQueue
});
var JobQueue, jobQueue;
var init_jobQueue = __esm({
  "electron/src/services/indexing/jobQueue.ts"() {
    "use strict";
    init_jobs_repo();
    init_indexOrchestrator();
    init_fileLogger();
    JobQueue = class {
      constructor() {
        this.isProcessing = false;
        this.pollInterval = null;
        this.intervalMs = 1e3;
      }
      // Poll every second
      async start() {
        if (this.pollInterval)
          return;
        try {
          logToFile("[JobQueue] Resetting stuck jobs...");
          const count = jobsRepo.resetProcessingJobs();
          console.log(`[JobQueue] Reset ${count} stuck jobs to pending`);
          logToFile(`[JobQueue] Reset ${count} stuck jobs`);
        } catch (err) {
          console.error("[JobQueue] Failed to reset stuck jobs:", err);
        }
        console.log("[JobQueue] Starting job queue worker... (Interval 1000ms)");
        logToFile("[JobQueue] Starting job queue worker");
        this.pollInterval = setInterval(() => {
          this.processNext();
        }, this.intervalMs);
      }
      stop() {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }
      async processNext() {
        if (this.isProcessing)
          return;
        try {
          const job = jobsRepo.getNextJob();
          if (!job)
            return;
          this.isProcessing = true;
          console.log(`[JobQueue] Processing job ${job.id} (${job.type})`);
          jobsRepo.updateStatus(job.id, "processing");
          try {
            const payload = JSON.parse(job.payloadJson);
            switch (job.type) {
              case "INDEX_FILE":
                await indexOrchestrator.indexFile(payload.fileId, payload.filePath, payload.sourceId);
                break;
              case "DELETE_FILE":
                await indexOrchestrator.deleteFile(payload.fileId);
                break;
              case "SCAN":
                break;
              default:
                console.warn(`[JobQueue] Unknown job type: ${job.type}`);
            }
            logToFile(`[JobQueue] Job ${job.id} completed`);
            jobsRepo.updateStatus(job.id, "completed");
            console.log(`[JobQueue] Job ${job.id} completed`);
          } catch (err) {
            logToFile(`[JobQueue] Job ${job.id} failed`, err.message);
            console.error(`[JobQueue] Job ${job.id} failed:`, err);
            jobsRepo.updateStatus(job.id, "failed", err.message || String(err));
          }
        } catch (err) {
          console.error("[JobQueue] Error in worker loop:", err);
        } finally {
          this.isProcessing = false;
        }
      }
    };
    jobQueue = new JobQueue();
  }
});

// electron/src/main/index.ts
var import_electron9 = require("electron");
var path8 = __toESM(require("path"));
var fs8 = __toESM(require("fs"));
init_db();
init_scanner();

// electron/src/ipc/handlers/ask.handlers.ts
var import_electron2 = require("electron");
init_chunks_repo();
var PYTHON_API_URL = "http://127.0.0.1:8000";
async function fallbackLocalSearch(question, topK = 3, errorReason) {
  console.log("[Ask] Using fallback local search");
  try {
    const results = chunksRepo.searchKeyword(question, {}, topK);
    const citations = results.map((r) => ({
      id: r.chunkId || r.id,
      name: r.name || "Unknown",
      path: r.path || "",
      type: r.type || "doc",
      snippet: r.snippet || r.text?.substring(0, 200) + "...",
      score: r.score || 0
    }));
    let answer = "\u26A0\uFE0F **Python API kh\xF4ng kh\u1EA3 d\u1EE5ng**";
    if (errorReason) {
      answer += `
**L\u1ED7i**: ${errorReason}
`;
    }
    answer += " - Hi\u1EC3n th\u1ECB k\u1EBFt qu\u1EA3 t\xECm ki\u1EBFm c\u1EE5c b\u1ED9:\n\n";
    if (citations.length === 0) {
      answer += "Kh\xF4ng t\xECm th\u1EA5y t\xE0i li\u1EC7u li\xEAn quan \u0111\u1EBFn c\xE2u h\u1ECFi c\u1EE7a b\u1EA1n.";
    } else {
      answer += `T\xECm th\u1EA5y **${citations.length}** t\xE0i li\u1EC7u li\xEAn quan:

`;
      citations.forEach((c, i) => {
        answer += `${i + 1}. **${c.name}**
   - Path: \`${c.path}\`
   - ${c.snippet}

`;
      });
      answer += "\n*\u0110\u1EC3 c\xF3 c\xE2u tr\u1EA3 l\u1EDDi AI chi ti\u1EBFt, vui l\xF2ng kh\u1EDFi \u0111\u1ED9ng Python backend.*";
    }
    return {
      id: Date.now().toString(),
      answer,
      citations,
      followUps: [
        "H\u01B0\u1EDBng d\u1EABn kh\u1EDFi \u0111\u1ED9ng Python backend?",
        "T\xECm ki\u1EBFm v\u1EDBi t\u1EEB kh\xF3a kh\xE1c"
      ],
      confidence: citations.length > 0 ? 0.5 : 0.1,
      usedTokens: 0
    };
  } catch (err) {
    console.error("[Ask] Fallback search error:", err);
    return {
      id: Date.now().toString(),
      answer: "\u274C Kh\xF4ng th\u1EC3 th\u1EF1c hi\u1EC7n t\xECm ki\u1EBFm. Vui l\xF2ng th\u1EED l\u1EA1i sau.",
      citations: [],
      followUps: [],
      confidence: 0,
      usedTokens: 0
    };
  }
}
async function callPythonAskAPI(request) {
  const response = await fetch(`${PYTHON_API_URL}/ask/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: request.question,
      mode: request.mode || "answer",
      context: request.context,
      top_k: request.top_k || 3
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python API error: ${response.status} - ${errorText}`);
  }
  return await response.json();
}
var registerAskHandlers = () => {
  const GREETINGS = [
    "hello",
    "hi",
    "hey",
    "xin ch\xE0o",
    "ch\xE0o",
    "ch\xE0o b\u1EA1n",
    "xin chao",
    "chao",
    "chao ban",
    "good morning",
    "good afternoon",
    "good evening",
    "ch\xE0o bu\u1ED5i s\xE1ng",
    "ch\xE0o bu\u1ED5i chi\u1EC1u",
    "ch\xE0o bu\u1ED5i t\u1ED1i",
    "alo",
    "helo",
    "hallo"
  ];
  const isGreeting = (text) => {
    const normalized = text.toLowerCase().trim();
    return GREETINGS.some((g) => normalized === g || normalized.startsWith(g + " ") || normalized.endsWith(" " + g));
  };
  import_electron2.ipcMain.handle("ask:query", async (event, args) => {
    console.log("[Ask] Raw args received:", JSON.stringify(args));
    const { question, context, mode, options } = args || {};
    console.log("[Ask] Query received:", { question, mode });
    if (isGreeting(question)) {
      return {
        id: Date.now().toString(),
        answer: '\u{1F44B} Xin ch\xE0o! T\xF4i c\xF3 th\u1EC3 gi\xFAp g\xEC cho b\u1EA1n?\n\nB\u1EA1n c\xF3 th\u1EC3 h\u1ECFi t\xF4i v\u1EC1 n\u1ED9i dung trong c\xE1c t\xE0i li\u1EC7u c\u1EE7a b\u1EA1n, v\xED d\u1EE5:\n- "T\xF3m t\u1EAFt n\u1ED9i dung file b\xE1o c\xE1o"\n- "T\xECm th\xF4ng tin v\u1EC1 d\u1EF1 \xE1n X"\n- "Gi\u1EA3i th\xEDch kh\xE1i ni\u1EC7m Y trong t\xE0i li\u1EC7u"',
        citations: [],
        followUps: [
          "T\xF4i c\xF3 nh\u1EEFng t\xE0i li\u1EC7u n\xE0o?",
          "H\u01B0\u1EDBng d\u1EABn s\u1EED d\u1EE5ng",
          "T\xECm ki\u1EBFm t\xE0i li\u1EC7u"
        ],
        confidence: 1,
        usedTokens: 0
      };
    }
    try {
      const result = await callPythonAskAPI({
        question,
        mode: mode || "answer",
        context: context ? {
          sources: context.sources,
          source_ids: context.sourceIds
        } : void 0,
        top_k: options?.topK || 3
      });
      console.log("[Ask] Python API response received, citations:", result.citations?.length);
      return JSON.parse(JSON.stringify(result));
    } catch (err) {
      console.error("[Ask] Python API error:", err.message);
      console.error("[Ask] Full error:", err);
      try {
        const fallbackResult = await fallbackLocalSearch(
          question,
          options?.topK || 3,
          err.message || "Unknown error"
        );
        return JSON.parse(JSON.stringify(fallbackResult));
      } catch (fallbackErr) {
        console.error("[Ask] Fallback also failed:", fallbackErr);
        return {
          id: Date.now().toString(),
          answer: `\u274C Error: ${err.message}. Fallback error: ${fallbackErr.message}`,
          citations: [],
          followUps: [],
          confidence: 0,
          usedTokens: 0
        };
      }
    }
  });
  import_electron2.ipcMain.handle("ask:check-backend", async () => {
    try {
      const response = await fetch(`${PYTHON_API_URL}/health/`, {
        method: "GET",
        signal: AbortSignal.timeout(3e3)
      });
      return { available: response.ok };
    } catch {
      return { available: false };
    }
  });
};

// electron/src/ipc/handlers/playground.handlers.ts
var import_electron3 = require("electron");
var registerPlaygroundHandlers = () => {
  import_electron3.ipcMain.handle("playground:run", async (event, request) => {
    console.log("Playground run request:", JSON.stringify(request, null, 2));
    await new Promise((resolve2) => setTimeout(resolve2, 800));
    const { prompt, retrieval, generation } = request;
    const mockAnswers = {
      "concise": `Redis is an in-memory data structure store used as a database, cache, and message broker. It supports strings, hashes, lists, sets, and more. Key features include high performance, replication, and persistence options.`,
      "detailed": `Redis (Remote Dictionary Server) is an open-source, in-memory data structure store. It is widely used as a database, cache, and message broker.
            
Key Features:
- **In-Memory Performance**: Extremely fast read/write operations.
- **Data Structures**: Supports strings, hashes, lists, sets, sorted sets, bitmaps, hyperloglogs, and geospatial indexes.
- **Persistence**: functionality to save data to disk via RDB snapshots or AOF logs.
- **Replication**: Master-slave replication for high availability.

It is often chosen for real-time applications, caching session data, and message queuing systems.`,
      "bullet_points": `- **Type**: In-memory data structure store
- **Uses**: Database, Cache, Message Broker
- **Performance**: High throughput, low latency
- **Features**: Persistence, Replication, Lua scripting, Transactions`
    };
    const style = generation.answerStyle || "detailed";
    const answer = mockAnswers[style] || mockAnswers["detailed"];
    const retrievedChunks = [
      {
        id: "chunk-1",
        fileName: "Redis_Caching.md",
        filePath: "/docs/backend/Redis_Caching.md",
        content: "Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache, and message broker.",
        score: 0.92,
        highlightRanges: [{ start: 0, end: 5 }]
      },
      {
        id: "chunk-2",
        fileName: "Architecture_Overview.pdf",
        filePath: "/docs/architecture/Architecture_Overview.pdf",
        content: "For our caching layer, we selected Redis due to its support for complex data types and persistence capabilities compared to Memcached.",
        score: 0.85
      },
      {
        id: "chunk-3",
        fileName: "Deployment_Guide.md",
        filePath: "/docs/ops/Deployment_Guide.md",
        content: "Ensure Redis is configured with maxmemory policy set to allkeys-lru for effective caching behavior.",
        score: 0.78
      }
    ];
    const limitedChunks = retrievedChunks.slice(0, retrieval.topK || 3);
    return {
      answer,
      retrievedChunks: limitedChunks,
      debug: {
        retrievalTimeMs: 120,
        // Mock time
        generationTimeMs: 450,
        // Mock time
        tokenUsage: {
          prompt: 156,
          completion: 85,
          total: 241
        },
        modelName: generation.model || "gpt-4o",
        finalPrompt: `System: ${prompt.system}

User: ${prompt.user}`
      }
    };
  });
};

// electron/src/ipc/index.ts
var registerIpcHandlers = () => {
  init_search_handlers();
  init_favorites_handlers();
  init_insights_handlers();
  init_documents_handlers();
  init_sources_handlers();
  registerAskHandlers();
  registerPlaygroundHandlers();
  console.log("IPC handlers registered");
};

// electron/src/main/index.ts
init_sources_repo();
var createWindow = () => {
  const mainWindow = new import_electron9.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path8.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    // Hide the default menu for a cleaner look
    autoHideMenuBar: true
  });
  if (process.env.NODE_ENV === "development" || !import_electron9.app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path8.join(__dirname, "../../../renderer/dist/index.html"));
  }
};
console.log("\n\n==================================================================");
console.log("   DESKAI ELECTRON MAIN PROCESS STARTED   ");
console.log("==================================================================\n\n");
import_electron9.app.whenReady().then(async () => {
  await initDb();
  registerIpcHandlers();
  const { jobQueue: jobQueue2 } = (init_jobQueue(), __toCommonJS(jobQueue_exports));
  jobQueue2.start();
  const docsPath = path8.join(import_electron9.app.getPath("documents"), "DeskAI_Docs");
  if (!fs8.existsSync(docsPath)) {
    fs8.mkdirSync(docsPath, { recursive: true });
  }
  let source = sourcesRepo.getByPath(docsPath);
  if (!source) {
    console.log("Creating default source:", docsPath);
    source = sourcesRepo.create({
      name: "My Docs",
      path: docsPath,
      type: "folder"
    });
  }
  fileScanner.scanSource(source.id, docsPath).catch((err) => console.error("Startup scan failed:", err));
  createWindow();
  import_electron9.app.on("activate", () => {
    if (import_electron9.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron9.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron9.app.quit();
  }
});
