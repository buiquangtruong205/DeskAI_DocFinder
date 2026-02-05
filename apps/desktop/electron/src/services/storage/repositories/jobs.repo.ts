import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface JobRecord {
  id: string;
  type: 'SCAN' | 'INDEX_FILE' | 'DELETE_FILE';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payloadJson: string;
  error: string | null;
  createdAt: number;
}

export const jobsRepo = {
  create: (job: Omit<JobRecord, 'id' | 'status' | 'error' | 'createdAt'>) => {
    const db = getDb();
    const id = uuidv4();
    const createdAt = Date.now();
    const stmt = db.prepare(`
      INSERT INTO jobs (id, type, status, payloadJson, error, createdAt)
      VALUES (@id, @type, 'pending', @payloadJson, NULL, @createdAt)
    `);
    stmt.run({ ...job, id, createdAt });
    return id;
  },

  createBatch: (jobs: Omit<JobRecord, 'id' | 'status' | 'error' | 'createdAt'>[]) => {
    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO jobs (id, type, status, payloadJson, error, createdAt)
      VALUES (@id, @type, 'pending', @payloadJson, NULL, @createdAt)
    `);

    const insertMany = db.transaction((jobsList: Omit<JobRecord, 'id' | 'status' | 'error' | 'createdAt'>[]) => {
      for (const job of jobsList) {
        insert.run({
          id: uuidv4(),
          type: job.type,
          payloadJson: job.payloadJson,
          createdAt: Date.now()
        });
      }
    });

    insertMany(jobs);
  },

  getNextJob: (): JobRecord | undefined => {
    const db = getDb();
    // FIFO
    const stmt = db.prepare('SELECT * FROM jobs WHERE status = ? ORDER BY createdAt ASC LIMIT 1');
    return stmt.get('pending') as JobRecord | undefined;
  },

  updateStatus: (id: string, status: 'pending' | 'processing' | 'completed' | 'failed', error?: string) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE jobs SET status = ?, error = ? WHERE id = ?');
    stmt.run(status, error || null, id);
  },

  clearCompleted: () => {
    const db = getDb();
    db.prepare("DELETE FROM jobs WHERE status = 'completed'").run();
  },

  getErrorJobs: (): JobRecord[] => {
    const db = getDb();
    return db.prepare("SELECT * FROM jobs WHERE status = 'failed'").all() as JobRecord[];
  },

  resetProcessingJobs: (): number => {
    const db = getDb();
    const result = db.prepare("UPDATE jobs SET status = 'pending' WHERE status = 'processing'").run();
    return result.changes;
  },

  deleteByFileId: (fileId: string) => {
    const db = getDb();
    // Search for fileId inside payloadJson using SQLite JSON functions
    const stmt = db.prepare("DELETE FROM jobs WHERE json_extract(payloadJson, '$.fileId') = ?");
    return stmt.run(fileId).changes;
  },

  deleteBySourceId: (sourceId: string) => {
    const db = getDb();
    const stmt = db.prepare("DELETE FROM jobs WHERE json_extract(payloadJson, '$.sourceId') = ?");
    return stmt.run(sourceId).changes;
  }
};
