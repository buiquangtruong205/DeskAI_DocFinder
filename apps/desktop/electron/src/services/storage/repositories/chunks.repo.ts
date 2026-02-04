import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface ChunkRecord {
  id: string;
  fileId: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

export const chunksRepo = {
  insertBatch: (chunks: Omit<ChunkRecord, 'id'>[]) => {
    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO chunks (id, fileId, chunkIndex, startOffset, endOffset, text)
      VALUES (@id, @fileId, @chunkIndex, @startOffset, @endOffset, @text)
    `);

    const insertMany = db.transaction((chunks: Omit<ChunkRecord, 'id'>[]) => {
      for (const chunk of chunks) {
        // Use deterministic ID to match Qdrant (fileId_chunkIndex)
        const deterministicId = `${chunk.fileId}_${chunk.chunkIndex}`;
        insert.run({ ...chunk, id: deterministicId });
      }
    });

    insertMany(chunks);
  },

  deleteByFileId: (fileId: string) => {
    const db = getDb();
    // Because of Trigger, this should also remove from chunks_fts (via DELETE trigger if implemented, or we might need to handle it)
    // In our schema in db.ts, we added triggers, so it should be fine.
    const stmt = db.prepare('DELETE FROM chunks WHERE fileId = ?');
    stmt.run(fileId);
  },

  searchKeyword: (query: string, filters: any = {}, limit = 20) => {
    const db = getDb();

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

    const params: any = { query };

    // Apply Filters (Dynamic SQL generation)
    if (filters.sourceId) {
      sql += ` AND files.sourceId = @sourceId`;
      params.sourceId = filters.sourceId;
    }

    // Note: FTS5 AND syntax is implicitly handled if we add more WHERE conditions? 
    // No, standard SQL WHERE applies after the FTS match usually, or as constraints.

    if (filters.type && filters.type !== 'all') {
      sql += ` AND files.type = @type`;
      params.type = filters.type;
    }

    // Date range (mtime is ms or unix? user said ms, typical in JS)
    if (filters.fromMtime) {
      sql += ` AND files.mtime >= @fromMtime`;
      params.fromMtime = filters.fromMtime;
    }
    if (filters.toMtime) {
      sql += ` AND files.mtime <= @toMtime`;
      params.toMtime = filters.toMtime;
    }

    sql += ` ORDER BY score ASC LIMIT @limit`; // BM25: lower is better

    params.limit = limit;

    try {
      return db.prepare(sql).all(params);
    } catch (e) {
      console.error("FTS Search Error", e);
      return [];
    }
  }
};
