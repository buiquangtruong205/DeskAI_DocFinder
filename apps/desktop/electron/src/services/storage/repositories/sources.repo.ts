import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { jobsRepo } from './jobs.repo';

export interface SourceRecord {
    id: string;
    name: string;
    path: string;
    type: 'folder' | 'collection';
    status: 'pending' | 'indexing' | 'indexed' | 'error' | 'paused';
    totalFiles: number;
    indexedFiles: number;
    failedFiles: number;
    lastUpdate: number | null;
    includeTypes: string | null;
    excludePatterns: string | null;
    createdAt: number;
}

export interface SourceErrorRecord {
    id: string;
    sourceId: string;
    filePath: string;
    message: string;
    createdAt: number;
}

export interface CreateSourceInput {
    name: string;
    path: string;
    type?: 'folder' | 'collection';
    includeTypes?: string[];
    excludePatterns?: string[];
}

export const sourcesRepo = {
    create: (input: CreateSourceInput): SourceRecord => {
        const db = getDb();
        const id = uuidv4();
        const now = Date.now();

        const stmt = db.prepare(`
      INSERT INTO sources (id, name, path, type, status, totalFiles, indexedFiles, failedFiles, lastUpdate, includeTypes, excludePatterns, createdAt)
      VALUES (@id, @name, @path, @type, @status, @totalFiles, @indexedFiles, @failedFiles, @lastUpdate, @includeTypes, @excludePatterns, @createdAt)
    `);

        const record = {
            id,
            name: input.name,
            path: input.path,
            type: input.type || 'folder',
            status: 'pending',
            totalFiles: 0,
            indexedFiles: 0,
            failedFiles: 0,
            lastUpdate: now,
            includeTypes: input.includeTypes ? JSON.stringify(input.includeTypes) : null,
            excludePatterns: input.excludePatterns ? JSON.stringify(input.excludePatterns) : null,
            createdAt: now
        };

        stmt.run(record);
        return record as SourceRecord;
    },

    getById: (id: string): SourceRecord | undefined => {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM sources WHERE id = ?');
        return stmt.get(id) as SourceRecord | undefined;
    },

    getByPath: (path: string): SourceRecord | undefined => {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM sources WHERE path = ?');
        return stmt.get(path) as SourceRecord | undefined;
    },

    getAll: (): SourceRecord[] => {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM sources ORDER BY createdAt DESC');
        return stmt.all() as SourceRecord[];
    },

    updateStatus: (id: string, status: SourceRecord['status']) => {
        const db = getDb();
        const stmt = db.prepare('UPDATE sources SET status = ?, lastUpdate = ? WHERE id = ?');
        stmt.run(status, Date.now(), id);
    },

    updateStats: (id: string, stats: { totalFiles?: number; indexedFiles?: number; failedFiles?: number }) => {
        const db = getDb();
        const updates: string[] = [];
        const values: any[] = [];

        if (stats.totalFiles !== undefined) {
            updates.push('totalFiles = ?');
            values.push(stats.totalFiles);
        }
        if (stats.indexedFiles !== undefined) {
            updates.push('indexedFiles = ?');
            values.push(stats.indexedFiles);
        }
        if (stats.failedFiles !== undefined) {
            updates.push('failedFiles = ?');
            values.push(stats.failedFiles);
        }

        updates.push('lastUpdate = ?');
        values.push(Date.now());
        values.push(id);

        const stmt = db.prepare(`UPDATE sources SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
    },

    incrementIndexedFiles: (id: string) => {
        const db = getDb();
        const stmt = db.prepare('UPDATE sources SET indexedFiles = indexedFiles + 1, lastUpdate = ? WHERE id = ?');
        stmt.run(Date.now(), id);
    },

    incrementFailedFiles: (id: string) => {
        const db = getDb();
        const stmt = db.prepare('UPDATE sources SET failedFiles = failedFiles + 1, lastUpdate = ? WHERE id = ?');
        stmt.run(Date.now(), id);
    },

    delete: (id: string) => {
        const db = getDb();
        // Clean up jobs first
        jobsRepo.deleteBySourceId(id);
        const stmt = db.prepare('DELETE FROM sources WHERE id = ?');
        stmt.run(id);
    },

    // Error management
    addError: (sourceId: string, filePath: string, message: string): string => {
        const db = getDb();
        const id = uuidv4();
        const stmt = db.prepare(`
      INSERT INTO source_errors (id, sourceId, filePath, message, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(id, sourceId, filePath, message, Date.now());
        return id;
    },

    getErrors: (sourceId: string): SourceErrorRecord[] => {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM source_errors WHERE sourceId = ? ORDER BY createdAt DESC');
        return stmt.all(sourceId) as SourceErrorRecord[];
    },

    clearErrors: (sourceId: string) => {
        const db = getDb();
        const stmt = db.prepare('DELETE FROM source_errors WHERE sourceId = ?');
        stmt.run(sourceId);
    },

    deleteError: (errorId: string) => {
        const db = getDb();
        const stmt = db.prepare('DELETE FROM source_errors WHERE id = ?');
        stmt.run(errorId);
    },

    // Get file type stats for a source
    getFileTypeStats: (sourceId: string): { [key: string]: number } => {
        const db = getDb();
        const stmt = db.prepare(`
      SELECT extension, COUNT(*) as count 
      FROM files 
      WHERE sourceId = ? 
      GROUP BY extension
    `);
        const rows = stmt.all(sourceId) as { extension: string; count: number }[];
        const stats: { [key: string]: number } = {};
        rows.forEach(row => {
            if (row.extension) {
                stats[row.extension] = row.count;
            }
        });
        return stats;
    }
};
