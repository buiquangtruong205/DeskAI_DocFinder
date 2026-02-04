// sources handlers - real database operations
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { sourcesRepo, SourceRecord } from '../../services/storage/repositories/sources.repo';
import { filesRepo } from '../../services/storage/repositories/files.repo';
import * as path from 'path';

// Helper to format relative time
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Transform DB record to API format
function transformSource(record: SourceRecord) {
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
    errors: errors.map(e => ({ file: e.filePath, message: e.message }))
  };
}

// List all sources
ipcMain.handle('sources:list', async () => {
  try {
    console.log('[sources:list] Getting all sources from DB...');
    const sources = sourcesRepo.getAll();
    console.log('[sources:list] Found', sources.length, 'sources');
    const result = sources.map(transformSource);
    console.log('[sources:list] Returning:', result);
    return result;
  } catch (error) {
    console.error('[sources:list] Failed to list sources:', error);
    throw error;
  }
});

// Add new source
ipcMain.handle('sources:add', async (_, data: { path: string; options: { name?: string; includeTypes: string[]; excludePatterns: string[] } }) => {
  try {
    console.log('[sources:add] Received data:', data);
    // Use custom name if provided, otherwise use folder basename
    const folderName = data.options.name?.trim() || path.basename(data.path);

    // Check if already exists
    const existing = sourcesRepo.getByPath(data.path);
    if (existing) {
      throw new Error('Source already exists');
    }

    // Create source record
    console.log('[sources:add] Creating source record with name:', folderName);
    const source = sourcesRepo.create({
      name: folderName,
      path: data.path,
      type: 'folder',
      includeTypes: data.options.includeTypes,
      excludePatterns: data.options.excludePatterns
    });
    console.log('[sources:add] Source created:', source);

    // Update status to indexing
    sourcesRepo.updateStatus(source.id, 'indexing');

    // Start scanning in background via FileScanner
    // fileScanner is async but we don't await it to block UI? 
    // Actually we should await scanSource because it just creates jobs (fairly fast scan of fs). 
    // The actual Processing is in JobQueue.
    const { fileScanner } = require('../../services/indexing/scanner');
    fileScanner.scanSource(source.id, data.path, {
      include: data.options.includeTypes,
      exclude: data.options.excludePatterns
    }).catch((err: any) => console.error("Scan failed:", err));

    const result = transformSource(sourcesRepo.getById(source.id)!);
    console.log('[sources:add] Returning:', result);
    return result;
  } catch (error) {
    console.error('[sources:add] Failed to add source:', error);
    throw error;
  }
});

// Remove source
ipcMain.handle('sources:remove', async (_, sourceId: string) => {
  try {
    // Delete all files associated with this source
    filesRepo.deleteBySourceId(sourceId);

    // Delete the source
    sourcesRepo.delete(sourceId);

    return true;
  } catch (error) {
    console.error('Failed to remove source:', error);
    throw error;
  }
});

// Reindex source
ipcMain.handle('sources:reindex', async (_, sourceId: string) => {
  try {
    const source = sourcesRepo.getById(sourceId);
    if (!source) throw new Error('Source not found');

    // Reset stats
    sourcesRepo.updateStats(sourceId, { indexedFiles: 0, failedFiles: 0 });
    sourcesRepo.updateStatus(sourceId, 'indexing');
    sourcesRepo.clearErrors(sourceId);

    // Note: We might NOT want to delete all files immediately if we want Diff to work efficiently?
    // User Requirement: "Scan folder... file mới/đổi -> job INDEX... file xoá -> job DELETE".
    // If we delete from DB here, then everything is "New". That is a "Full Reindex". 
    // "Re-index" button usually implies Full.
    // So clearing DB is valid for "Reindex". 
    // But for "Add Source" or "Scan on Startup/Resume", we want preservation.

    // For manual Reindex, let's clear.
    filesRepo.deleteBySourceId(sourceId);

    const includeTypes = source.includeTypes ? JSON.parse(source.includeTypes) : ['.md', '.txt', '.pdf', '.py', '.js', '.ts'];
    const excludePatterns = source.excludePatterns ? JSON.parse(source.excludePatterns) : ['node_modules', '.git'];

    const { fileScanner } = require('../../services/indexing/scanner');
    fileScanner.scanSource(sourceId, source.path, { include: includeTypes, exclude: excludePatterns })
      .catch((err: any) => console.error("Rescan failed:", err));

    return true;
  } catch (error) {
    console.error('Failed to reindex source:', error);
    throw error;
  }
});

// Pause indexing
ipcMain.handle('sources:pause', async (_, sourceId: string) => {
  try {
    sourcesRepo.updateStatus(sourceId, 'paused');
    return true;
  } catch (error) {
    console.error('Failed to pause source:', error);
    throw error;
  }
});

// Resume indexing
ipcMain.handle('sources:resume', async (_, sourceId: string) => {
  try {
    const source = sourcesRepo.getById(sourceId);
    if (!source) throw new Error('Source not found');

    sourcesRepo.updateStatus(sourceId, 'indexing');

    // Trigger scan again to pick up where left off or find new files
    const includeTypes = source.includeTypes ? JSON.parse(source.includeTypes) : ['.md', '.txt', '.pdf'];
    const excludePatterns = source.excludePatterns ? JSON.parse(source.excludePatterns) : ['node_modules', '.git'];

    const { fileScanner } = require('../../services/indexing/scanner');
    fileScanner.scanSource(sourceId, source.path, { include: includeTypes, exclude: excludePatterns })
      .catch((err: any) => console.error("Resume scan failed:", err));

    return true;
  } catch (error) {
    console.error('Failed to resume source:', error);
    throw error;
  }
});

// Get indexing status
ipcMain.handle('sources:getStatus', async (_, sourceId: string) => {
  try {
    const source = sourcesRepo.getById(sourceId);
    if (!source) throw new Error('Source not found');

    // With Job Queue, we should also maybe count pending jobs for this source?
    // User Table `sources` has totalFiles, indexedFiles.
    // FileScanner updates `files` table status to 'pending'.
    // Job processing updates to 'indexed'.
    // `sources.repo` methods might need updates to count correctly if they relied on manual updates.
    // But `transformSource` calls `sourcesRepo.getAll()` which reads table columns.
    // Who updates `sources` table counts?
    // `IndexOrchestrator` / `JobQueue` should update Source stats.

    // For now, let's rely on what's in DB.

    const progress = source.totalFiles > 0
      ? Math.round((source.indexedFiles / source.totalFiles) * 100)
      : 0;

    let statusText = 'Idle';
    if (source.status === 'indexing') {
      statusText = `Indexing (${progress}%)`;
    }

    return {
      sourceId,
      progress,
      currentFile: '', // hard to track with async jobs unless we join jobs table
      statusText,
      filesProcessed: source.indexedFiles,
      totalFiles: source.totalFiles
    };
  } catch (error) {
    console.error('Failed to get status:', error);
    throw error;
  }
});

// Retry failed files
ipcMain.handle('sources:retryFailed', async (_, sourceId: string) => {
  // ... existing logic ...
  return true;
});

// Dialog to select folder from file system
ipcMain.handle('dialog:selectFolder', async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  const result = await dialog.showOpenDialog(focusedWindow || undefined as any, {
    title: 'Chọn thư mục',
    properties: ['openDirectory'],
    buttonLabel: 'Chọn'
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// Background indexing function
async function startIndexing(sourceId: string, folderPath: string, includeTypes: string[], excludePatterns: string[]) {
  try {
    // Use fileScanner to scan and index
    const fs = require('fs');
    const pathModule = require('path');

    // Recursive file scanning
    const files: string[] = [];

    function scanDir(dir: string) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = pathModule.join(dir, entry.name);

          // Check exclusions
          if (excludePatterns.some(pattern => entry.name === pattern || fullPath.includes(pattern))) {
            continue;
          }

          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.isFile()) {
            const ext = pathModule.extname(entry.name).toLowerCase();
            if (includeTypes.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (err) {
        console.error('Error scanning directory:', dir, err);
      }
    }

    scanDir(folderPath);

    // Update total files count
    sourcesRepo.updateStats(sourceId, { totalFiles: files.length });

    // Process each file
    for (const filePath of files) {
      // Check if paused
      const source = sourcesRepo.getById(sourceId);
      if (source?.status === 'paused') {
        break;
      }

      try {
        const stats = fs.statSync(filePath);
        const ext = pathModule.extname(filePath).toLowerCase();
        const name = pathModule.basename(filePath);

        // Determine file type
        let type = 'text';
        if (['.md'].includes(ext)) type = 'markdown';
        else if (['.pdf'].includes(ext)) type = 'pdf';
        else if (['.py'].includes(ext)) type = 'python';
        else if (['.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.go', '.rs'].includes(ext)) type = 'code';
        else if (['.json'].includes(ext)) type = 'json';

        // Check if file already exists
        const existing = filesRepo.getByPath(filePath);
        if (existing) {
          // Update if modified
          if (stats.mtimeMs > existing.mtime) {
            filesRepo.updateStatus(existing.id, 'pending');
          }
        } else {
          // Create new file record
          filesRepo.create({
            path: filePath,
            sourceId,
            name,
            extension: ext,
            type,
            size: stats.size,
            mtime: stats.mtimeMs,
            indexedAt: Date.now(),
            status: 'indexed',
            hash: null
          });
        }

        sourcesRepo.incrementIndexedFiles(sourceId);
      } catch (err: any) {
        console.error('Error processing file:', filePath, err);
        sourcesRepo.addError(sourceId, filePath, err.message || 'Unknown error');
        sourcesRepo.incrementFailedFiles(sourceId);
      }
    }

    // Mark as complete
    const finalSource = sourcesRepo.getById(sourceId);
    if (finalSource && finalSource.status === 'indexing') {
      if (finalSource.failedFiles > 0) {
        sourcesRepo.updateStatus(sourceId, 'error');
      } else {
        sourcesRepo.updateStatus(sourceId, 'indexed');
      }
    }

    console.log(`Indexing complete for source ${sourceId}: ${files.length} files processed`);
  } catch (error) {
    console.error('Indexing failed:', error);
    sourcesRepo.updateStatus(sourceId, 'error');
  }
}
