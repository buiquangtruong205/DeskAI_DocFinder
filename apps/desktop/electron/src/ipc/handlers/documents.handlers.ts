import { ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { filesRepo, FileRecord } from '../../services/storage/repositories/files.repo';
import { sourcesRepo } from '../../services/storage/repositories/sources.repo';
import { jobsRepo } from '../../services/storage/repositories/jobs.repo';
import { logToFile } from '../../utils/fileLogger';

// Helper to format file size
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper to format relative time
function formatRelativeTime(timestamp: number): string {
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

/**
 * Validates if a path is within any of the registered sources.
 * Prevents directory traversal and unauthorized file access.
 */
function validatePath(filePath: string): boolean {
    if (!filePath) return false;
    try {
        const normalizedPath = path.normalize(filePath).toLowerCase();
        const sources = sourcesRepo.getAll();

        // Ensure the path is within at least one source directory
        return sources.some(source => {
            const normalizedSourcePath = path.normalize(source.path).toLowerCase();
            return normalizedPath.startsWith(normalizedSourcePath);
        });
    } catch (err) {
        console.error('Path validation error:', err);
        return false;
    }
}

// Transform DB record to API format
function transformFile(record: FileRecord) {
    // Get source name
    let sourceName = 'Unknown';
    if (record.sourceId) {
        const source = sourcesRepo.getById(record.sourceId);
        if (source) {
            // Extract relative path from file path
            const relativePath = record.path.replace(source.path, '').replace(/^[/\\]/, '');
            const parts = relativePath.split(/[/\\]/);
            parts.pop(); // Remove filename
            sourceName = parts.length > 0 ? `${source.name}/${parts.join('/')}` : source.name;
        }
    }

    // Map file type
    let type: string = record.type || 'text';
    if (record.extension === '.md') type = 'markdown';
    else if (record.extension === '.pdf') type = 'pdf';
    else if (record.extension === '.py') type = 'python';
    else if (['.js', '.ts', '.jsx', '.tsx'].includes(record.extension)) type = 'code';
    else if (record.extension === '.json') type = 'json';
    else if (record.extension === '.txt') type = 'text';

    return {
        id: record.id,
        name: record.name,
        path: record.path,
        source: sourceName,
        sourceId: record.sourceId || '',
        type,
        size: formatSize(record.size),
        sizeBytes: record.size,
        tags: [], // TODO: Implement tags from tags table
        isFavorite: record.isFavorite === 1,
        status: record.status,
        lastModified: new Date(record.mtime).toISOString(),
        lastIndexed: new Date(record.indexedAt).toISOString(),
        errorMessage: record.errorMessage || undefined
    };
}

// List documents with filters
ipcMain.handle('documents:list', async (_, filters?: {
    sourceId?: string;
    searchQuery?: string;
    filterType?: 'all' | 'favorites' | 'failed' | 'recent';
    fileType?: string;
    folderId?: string;
}, sort?: { key: string; order: 'asc' | 'desc' }) => {
    try {
        let files = filesRepo.list({
            sourceId: filters?.sourceId,
            search: filters?.searchQuery,
            type: filters?.fileType,
            favoritesOnly: filters?.filterType === 'favorites',
            status: filters?.filterType === 'failed' ? 'error' : undefined
        });

        // Apply recent filter
        if (filters?.filterType === 'recent') {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            files = files.filter(f => f.indexedAt > oneDayAgo);
        }

        // Apply folder filter
        if (filters?.folderId && filters.folderId !== 'all') {
            // Find folder path from sources or file paths
            const sources = sourcesRepo.getAll();
            let folderPath = '';

            for (const source of sources) {
                if (filters.folderId === `folder-${source.id}`) {
                    folderPath = source.path;
                    break;
                }
            }

            if (folderPath) {
                files = files.filter(f => f.path.startsWith(folderPath));
            }
        }

        // Apply sorting
        if (sort) {
            files.sort((a, b) => {
                let comparison = 0;
                switch (sort.key) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'lastIndexed':
                        comparison = a.indexedAt - b.indexedAt;
                        break;
                    case 'lastModified':
                        comparison = a.mtime - b.mtime;
                        break;
                    case 'size':
                        comparison = a.size - b.size;
                        break;
                }
                return sort.order === 'desc' ? -comparison : comparison;
            });
        }

        return files.map(transformFile);
    } catch (error) {
        console.error('Failed to list documents:', error);
        throw error;
    }
});

// Get folder tree
ipcMain.handle('documents:getFolderTree', async () => {
    try {
        const sources = sourcesRepo.getAll();
        const totalCount = filesRepo.getAll().length;

        const tree = [{
            id: 'all',
            name: 'All Documents',
            path: '',
            documentCount: totalCount,
            isExpanded: true,
            children: sources.map(source => ({
                id: `folder-${source.id}`,
                name: source.name,
                path: source.path,
                documentCount: filesRepo.countBySourceId(source.id),
                isExpanded: false,
                children: [] // Could add subfolder support later
            }))
        }];

        return tree;
    } catch (error) {
        console.error('Failed to get folder tree:', error);
        throw error;
    }
});

// Get document by ID
ipcMain.handle('documents:getById', async (_, documentId: string) => {
    try {
        const file = filesRepo.getById(documentId);
        if (!file) return null;

        // Security check
        if (!validatePath(file.path)) {
            console.warn(`[Security] Unauthorized access attempt to document: ${file.path}`);
            throw new Error('Unauthorized: Path is outside of allowed sources');
        }

        const doc = transformFile(file);

        // Try to read content
        try {
            if (fs.existsSync(file.path)) {
                const content = fs.readFileSync(file.path, 'utf-8');
                return { ...doc, content };
            }
        } catch (err) {
            console.warn('Could not read file content:', err);
        }

        return doc;
    } catch (error) {
        console.error('Failed to get document:', error);
        throw error;
    }
});

// Toggle favorite
ipcMain.handle('documents:toggleFavorite', async (_, documentId: string) => {
    try {
        const newValue = filesRepo.toggleFavorite(documentId);
        return newValue;
    } catch (error) {
        console.error('Failed to toggle favorite:', error);
        throw error;
    }
});

// Reindex document
ipcMain.handle('documents:reindex', async (_, documentId: string) => {
    try {
        const file = filesRepo.getById(documentId);
        if (!file) throw new Error('File not found');

        filesRepo.updateStatus(documentId, 'pending');

        // Create a real job
        jobsRepo.create({
            type: 'INDEX_FILE',
            payloadJson: JSON.stringify({
                fileId: file.id,
                filePath: file.path,
                sourceId: file.sourceId
            })
        });

        logToFile(`[IPC] Reindex requested for file: ${file.path}`);
        return true;
    } catch (error) {
        console.error('Failed to reindex document:', error);
        throw error;
    }
});

// Remove document
ipcMain.handle('documents:remove', async (_, documentId: string) => {
    try {
        filesRepo.delete(documentId);
        return true;
    } catch (error) {
        console.error('Failed to remove document:', error);
        throw error;
    }
});

// Reveal in explorer
ipcMain.handle('documents:reveal', async (_, filePath: string) => {
    try {
        let targetPath = path.normalize(filePath);
        console.log('Revealing file in explorer:', targetPath);

        // Security check
        if (!validatePath(targetPath)) {
            console.warn(`[Security] Unauthorized reveal attempt: ${targetPath}`);
            return false;
        }

        if (!fs.existsSync(targetPath)) {
            console.warn('File does not exist:', targetPath);
            // Try to open the parent folder if file doesn't exist
            const dirPath = path.dirname(targetPath);
            if (fs.existsSync(dirPath)) {
                await shell.openPath(dirPath);
                return true;
            }
            console.error('Parent directory does not exist either:', dirPath);
            return false;
        }

        await shell.showItemInFolder(targetPath);
        return true;
    } catch (error) {
        console.error('Failed to reveal file:', error);
        throw error;
    }
});

// Open document
ipcMain.handle('documents:open', async (_, filePath: string) => {
    try {
        console.log('Opening file:', filePath);

        // Security check
        if (!validatePath(filePath)) {
            console.warn(`[Security] Unauthorized open attempt: ${filePath}`);
            return false;
        }

        const result = await shell.openPath(filePath);
        if (result) {
            throw new Error(`Failed to open file: ${result}`);
        }
        return true;
    } catch (error) {
        console.error('Failed to open document:', error);
        throw error;
    }
});

// Aliases maintained for frontend compatibility, but they now use the secured versions
ipcMain.handle('file:open', async (_, filePath) => {
    return await shell.openPath(filePath) === '' ? true : false;
});

ipcMain.handle('file:showInFolder', async (_, filePath) => {
    if (!validatePath(filePath)) return false;
    shell.showItemInFolder(filePath);
    return true;
});

// Bulk remove
ipcMain.handle('documents:bulkRemove', async (_, documentIds: string[]) => {
    try {
        for (const id of documentIds) {
            filesRepo.delete(id);
        }
        return true;
    } catch (error) {
        console.error('Failed to bulk remove:', error);
        throw error;
    }
});

// Bulk reindex
ipcMain.handle('documents:bulkReindex', async (_, documentIds: string[]) => {
    try {
        const jobs = [];
        for (const id of documentIds) {
            const file = filesRepo.getById(id);
            if (file) {
                filesRepo.updateStatus(id, 'pending');
                jobs.push({
                    type: 'INDEX_FILE' as const,
                    payloadJson: JSON.stringify({
                        fileId: file.id,
                        filePath: file.path,
                        sourceId: file.sourceId
                    })
                });
            }
        }

        if (jobs.length > 0) {
            jobsRepo.createBatch(jobs);
        }

        return true;
    } catch (error) {
        console.error('Failed to bulk reindex:', error);
        throw error;
    }
});

