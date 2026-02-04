import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { filesRepo } from '../storage/repositories/files.repo';
import { jobsRepo } from '../storage/repositories/jobs.repo';
import { v4 as uuidv4 } from 'uuid';

export class FileScanner extends EventEmitter {

  constructor() {
    super();
  }

  /**
   * Scans a source folder and schedules INDEX_FILE / DELETE_FILE jobs.
   * @param sourceId The ID of the source in DB
   * @param sourcePath Absolute path to the source folder
   * @param options Include/Exclude patterns
   */
  public async scanSource(sourceId: string, sourcePath: string, options: { include?: string[], exclude?: string[] } = {}) {
    console.log(`[FileScanner] Scanning source: ${sourcePath} (${sourceId})`);

    try {
      if (!fs.existsSync(sourcePath)) {
        console.error(`[FileScanner] Source path not found: ${sourcePath}`);
        return;
      }

      // 1. Get all current files on disk
      const diskFiles = await this.recursiveScan(sourcePath, options.exclude);
      const diskFileMap = new Map<string, { size: number, mtime: number }>();
      diskFiles.forEach(f => diskFileMap.set(f.path, { size: f.size, mtime: f.mtime }));

      // 2. Get all DB files for this source
      const dbFiles = filesRepo.getBySourceId(sourceId);
      const dbFileMap = new Map<string, typeof dbFiles[0]>();
      dbFiles.forEach(f => dbFileMap.set(f.path, f));

      const jobsToCreate: { type: 'INDEX_FILE' | 'DELETE_FILE', payloadJson: string }[] = [];
      const newFilesToInsert: any[] = []; // We need to batch insert files logic ideally, but repo doesn't support batch yet.

      // 3. Diff: Check for New / Modified
      for (const [filePath, stats] of diskFileMap) {
        const ext = path.extname(filePath).toLowerCase();
        // Filter by include types if specified
        if (options.include && options.include.length > 0) {
          if (!options.include.includes(ext)) continue;
        } else {
          // Default whitelist if no options provided? Or accept all?
          // Using user's list: .md .txt .pdf .py .js ...
          const defaultExts = ['.md', '.txt', '.pdf', '.py', '.js', '.ts', '.json', '.html', '.css', '.java', '.cpp', '.c', '.h', '.vue'];
          if (!defaultExts.includes(ext)) continue;
        }

        const dbFile = dbFileMap.get(filePath);

        if (!dbFile) {
          // NEW FILE
          const fileId = uuidv4();
          // Determine type
          let type = 'doc';
          if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.json', '.html', '.css', '.vue'].includes(ext)) {
            type = 'code';
          } else if (['.pdf'].includes(ext)) {
            type = 'pdf';
          }

          // Insert into DB as 'pending'
          filesRepo.create({
            path: filePath,
            name: path.basename(filePath),
            extension: ext,
            type: type,
            sourceId: sourceId,
            size: stats.size,
            mtime: stats.mtime,
            indexedAt: 0,
            status: 'pending',
            hash: null
          });

          // Create Job
          jobsToCreate.push({
            type: 'INDEX_FILE',
            payloadJson: JSON.stringify({ fileId: fileId, filePath: filePath, sourceId })
          });

        } else {
          // EXISTING FILE - Check for modification
          // Compare mtime (and maybe size)
          // Note: DB mtime might be different precision or timezone issues, but usually raw number comparison is fine.
          if (Math.abs(dbFile.mtime - stats.mtime) > 1000 || dbFile.size !== stats.size || dbFile.status === 'error') {
            // MODIFIED
            jobsToCreate.push({
              type: 'INDEX_FILE',
              payloadJson: JSON.stringify({ fileId: dbFile.id, filePath: filePath, sourceId })
            });

            // Update status to pending
            filesRepo.updateStatus(dbFile.id, 'pending');
          }
        }
      }

      // 4. Diff: Check for Deleted
      for (const [filePath, dbFile] of dbFileMap) {
        if (!diskFileMap.has(filePath)) {
          // DELETE
          jobsToCreate.push({
            type: 'DELETE_FILE',
            payloadJson: JSON.stringify({ fileId: dbFile.id, filePath: filePath, sourceId })
          });
        }
      }

      // 5. Submit Jobs
      if (jobsToCreate.length > 0) {
        console.log(`[FileScanner] Creating ${jobsToCreate.length} jobs for source ${sourceId}`);
        jobsRepo.createBatch(jobsToCreate);
      } else {
        console.log(`[FileScanner] No changes detected for source ${sourceId}`);
      }

    } catch (err) {
      console.error(`[FileScanner] Error scanning source ${sourceId}:`, err);
    }
  }

  private async recursiveScan(dir: string, excludePatterns: string[] = []): Promise<{ path: string, size: number, mtime: number }[]> {
    let results: { path: string, size: number, mtime: number }[] = [];

    // Default system excludes
    const systemExcludes = ['node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__'];
    const allExcludes = [...systemExcludes, ...excludePatterns];

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const resPath = path.resolve(dir, entry.name);

        // Check excludes
        if (allExcludes.some(pattern => resPath.includes(pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          const subResults = await this.recursiveScan(resPath, excludePatterns);
          results = results.concat(subResults);
        } else {
          // It's a file
          try {
            const stats = await fs.promises.stat(resPath);
            // Skip large files (e.g. > 10MB)
            if (stats.size > 10 * 1024 * 1024) continue;

            results.push({
              path: resPath,
              size: stats.size,
              mtime: stats.mtimeMs
            });
          } catch (e) {
            // ignore stat errors (locked files etc)
          }
        }
      }
    } catch (e) {
      // ignore access errors
      console.error(`Error reading dir ${dir}:`, e);
    }
    return results;
  }
}

export const fileScanner = new FileScanner();
