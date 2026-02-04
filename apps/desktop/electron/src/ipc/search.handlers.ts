import { ipcMain } from 'electron';
import { searchService } from '../services/search/searchService';
import { filesRepo } from '../services/storage/repositories/files.repo';
import { chunksRepo } from '../services/storage/repositories/chunks.repo';

export function registerSearchHandlers() {
    ipcMain.handle('search', async (_, { query, mode, filters, topK }) => {
        try {
            console.log('Search request:', { query, mode });
            return await searchService.search(query, { mode, filters, topK });
        } catch (error: any) {
            console.error('Search error:', error);
            throw new Error(error.message || 'Search failed');
        }
    });

    ipcMain.handle('get-preview', async (_, { fileId, chunkId }) => {
        // Retrieve file path and content
        const file = filesRepo.getById(fileId);
        if (!file) throw new Error('File not found');

        // TODO: We need a way to get content. 
        // Re-read file? Or fetch from chunks if we stored text there?
        // Chunks repo has text.

        // If chunkId provided, try to find that specific chunk to highlight?
        // For now just return full file content via re-read or construct from chunks logic
        // Ideally we re-read the file from disk using `textExtractor` again or `fs`.
        // Let's use fs for now.

        const fs = require('fs/promises');
        const content = await fs.readFile(file.path, 'utf-8');

        return {
            content,
            metadata: file
        };
    });
}
