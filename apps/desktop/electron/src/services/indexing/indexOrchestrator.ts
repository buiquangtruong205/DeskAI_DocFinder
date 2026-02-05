import { extractText } from './textExtractor';
import { chunkText } from './chunker';
import { filesRepo } from '../storage/repositories/files.repo';
import { chunksRepo } from '../storage/repositories/chunks.repo';
import { sourcesRepo } from '../storage/repositories/sources.repo';
import { pythonClient } from '../search/pythonClient';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export class IndexOrchestrator {

  public async indexFile(fileId: string, filePath: string, sourceId: string) {
    console.log(`[IndexOrchestrator] Indexing file: ${filePath}`);

    try {
      // 0. Ensure AI index is clean for this file (idempotency)
      await pythonClient.deleteFile(fileId).catch(err => {
        console.warn(`[IndexOrchestrator] Non-critical: Pre-index cleanup failed for ${fileId}:`, err.message);
      });
      // 1. Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = await fs.promises.stat(filePath);

      // 2. Extract Text
      const text = await extractText(filePath);
      if (!text || text.trim().length === 0) {
        console.log(`[IndexOrchestrator] No text extracted from ${filePath}. Updating metadata only.`);
        filesRepo.updateStatus(fileId, 'indexed');
        sourcesRepo.incrementIndexedFiles(sourceId);
        return;
      }

      // Calculate Hash
      const hash = crypto.createHash('sha256').update(text).digest('hex');

      // 3. Chunking
      const chunks = chunkText(text);

      // 4. Save Chunks to SQLite (Chunks Table)
      // Ensure no old chunks exist first (idempotency)
      chunksRepo.deleteByFileId(fileId);

      const chunksData = chunks.map((c, idx) => ({
        fileId: fileId,
        chunkIndex: idx,
        startOffset: c.start,
        endOffset: c.end,
        text: c.text,
        created_at_ms: Date.now()
      }));

      chunksRepo.insertBatch(chunksData);

      // 5. Semantic Indexing (Qdrant via Python)
      // Determine type
      const ext = path.extname(filePath).toLowerCase();
      let type = 'doc';
      if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.json', '.html', '.css', '.vue'].includes(ext)) {
        type = 'code';
      } else if (['.pdf'].includes(ext)) {
        type = 'pdf';
      }

      const payloadChunks = chunksData.map(c => ({
        chunkId: `${c.fileId}_${c.chunkIndex}`,
        text: c.text,
        fileId: c.fileId,
        metadata: {
          file_id: c.fileId,
          source_id: sourceId,
          type: type, // doc, code, pdf
          tags: [],
          mtime_ms: stats.mtimeMs,
          // For display in citations
          file_name: path.basename(filePath),
          file_path: filePath,
          // Legacy fields (keep for backwards compatibility)
          title: path.basename(filePath),
          path: filePath,
          snippet: c.text.substring(0, 200), // Extended snippet for better context
          text: c.text // Full text for RAG context
        }
      }));

      await pythonClient.indexChunks(payloadChunks);

      // 6. Update File Status
      filesRepo.updateHash(fileId, hash);
      filesRepo.updateStatus(fileId, 'indexed', Date.now());

      // Update Source Stats (IMPORTANT for UI Progress)
      sourcesRepo.incrementIndexedFiles(sourceId);

      console.log(`[IndexOrchestrator] Successfully indexed ${filePath} (${chunks.length} chunks)`);

    } catch (err: any) {
      console.error(`[IndexOrchestrator] Error indexing ${filePath}:`, err);
      filesRepo.updateStatus(fileId, 'error', Date.now(), err.message);

      // Update Source Stats (Failed)
      sourcesRepo.incrementFailedFiles(sourceId);

      throw err; // Re-throw so JobQueue marks job as failed
    }
  }

  public async deleteFile(fileId: string) {
    console.log(`[IndexOrchestrator] Deleting file: ${fileId}`);
    try {
      // 1. Delete from SQLite
      // Cascade delete will remove chunks, tags, jobs, source_errors... 
      // Wait, filesRepo.delete does `DELETE FROM files`. 
      // We verified db.ts has `ON DELETE CASCADE` for chunks.

      // 2. Delete from Qdrant
      await pythonClient.deleteFile(fileId).catch(err => {
        console.error('[IndexOrchestrator] Failed to delete from Qdrant during sync:', err);
      });

      filesRepo.delete(fileId);
      console.log(`[IndexOrchestrator] Deleted file record ${fileId} and synced with AI`);

    } catch (err) {
      console.error(`[IndexOrchestrator] Error deleting file ${fileId}:`, err);
      throw err;
    }
  }
}

export const indexOrchestrator = new IndexOrchestrator();
