import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { jobsRepo } from './jobs.repo';

export interface FileRecord {
  id: string;
  path: string;
  sourceId: string | null;
  name: string;
  extension: string;
  type: string; // doc, code, pdf, etc.
  size: number;
  mtime: number;
  indexedAt: number;
  status: 'pending' | 'indexed' | 'error';
  hash: string | null;
  isFavorite: number; // 0 or 1
  errorMessage: string | null;
}

export interface ListFilesOptions {
  sourceId?: string;
  status?: 'pending' | 'indexed' | 'error';
  type?: string;
  search?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}

export const filesRepo = {
  create: (file: Omit<FileRecord, 'id' | 'isFavorite' | 'errorMessage'>) => {
    const db = getDb();
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO files (id, path, sourceId, name, extension, type, size, mtime, indexedAt, status, hash, isFavorite, errorMessage)
      VALUES (@id, @path, @sourceId, @name, @extension, @type, @size, @mtime, @indexedAt, @status, @hash, 0, NULL)
    `);
    stmt.run({ ...file, id });
    return id;
  },

  getByPath: (path: string): FileRecord | undefined => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE path = ?');
    return stmt.get(path) as FileRecord | undefined;
  },

  getById: (id: string): FileRecord | undefined => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
    return stmt.get(id) as FileRecord | undefined;
  },

  updateStatus: (id: string, status: 'pending' | 'indexed' | 'error', indexedAt = Date.now(), errorMessage?: string) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE files SET status = ?, indexedAt = ?, errorMessage = ? WHERE id = ?');
    stmt.run(status, indexedAt, errorMessage || null, id);
  },

  updateHash: (id: string, hash: string) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE files SET hash = ? WHERE id = ?');
    stmt.run(hash, id);
  },

  delete: (id: string) => {
    const db = getDb();
    // Clean up jobs first
    jobsRepo.deleteByFileId(id);
    const stmt = db.prepare('DELETE FROM files WHERE id = ?');
    stmt.run(id);
  },

  deleteBySourceId: (sourceId: string) => {
    const db = getDb();
    // Clean up all jobs for all files in this source
    jobsRepo.deleteBySourceId(sourceId);
    const stmt = db.prepare('DELETE FROM files WHERE sourceId = ?');
    stmt.run(sourceId);
  },

  getAll: (): FileRecord[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files ORDER BY mtime DESC');
    return stmt.all() as FileRecord[];
  },

  list: (options: ListFilesOptions = {}): FileRecord[] => {
    const db = getDb();
    let query = 'SELECT * FROM files WHERE 1=1';
    const params: any[] = [];

    if (options.sourceId) {
      query += ' AND sourceId = ?';
      params.push(options.sourceId);
    }

    if (options.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options.favoritesOnly) {
      query += ' AND isFavorite = 1';
    }

    if (options.search) {
      query += ' AND (name LIKE ? OR path LIKE ?)';
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY mtime DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const stmt = db.prepare(query);
    return stmt.all(...params) as FileRecord[];
  },

  countBySourceId: (sourceId: string): number => {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM files WHERE sourceId = ?');
    const result = stmt.get(sourceId) as { count: number };
    return result.count;
  },

  countByStatus: (sourceId: string, status: 'pending' | 'indexed' | 'error'): number => {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM files WHERE sourceId = ? AND status = ?');
    const result = stmt.get(sourceId, status) as { count: number };
    return result.count;
  },

  toggleFavorite: (id: string): boolean => {
    const db = getDb();
    const file = filesRepo.getById(id);
    if (!file) return false;

    const newValue = file.isFavorite ? 0 : 1;
    const stmt = db.prepare('UPDATE files SET isFavorite = ? WHERE id = ?');
    stmt.run(newValue, id);
    return newValue === 1;
  },

  setFavorite: (id: string, isFavorite: boolean) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE files SET isFavorite = ? WHERE id = ?');
    stmt.run(isFavorite ? 1 : 0, id);
  },

  getBySourceId: (sourceId: string): FileRecord[] => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE sourceId = ? ORDER BY path ASC');
    return stmt.all(sourceId) as FileRecord[];
  },

  // Get distinct folders from file paths for a source
  getDistinctFolders: (sourceId?: string): string[] => {
    const db = getDb();
    let query = 'SELECT DISTINCT path FROM files';
    const params: any[] = [];

    if (sourceId) {
      query += ' WHERE sourceId = ?';
      params.push(sourceId);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as { path: string }[];

    // Extract folder paths from file paths
    const folderSet = new Set<string>();
    rows.forEach(row => {
      const parts = row.path.split(/[/\\]/);
      parts.pop(); // Remove filename
      if (parts.length > 0) {
        folderSet.add(parts.join('/'));
      }
    });

    return Array.from(folderSet).sort();
  }
};

