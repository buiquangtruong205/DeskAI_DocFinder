// search handlers
import { ipcMain, shell } from 'electron';
import { searchService, SearchOptions } from '../../services/search/searchService';
import { filesRepo } from '../../services/storage/repositories/files.repo';

ipcMain.handle('search:query', async (event, { query, options }: { query: string, options: SearchOptions }) => {
  try {
    console.log('[search:query] Request:', query, options);
    const { results, stats } = await searchService.search(query, options);
    return { success: true, results, stats };
  } catch (err: any) {
    console.error('[search:query] Error:', err);
    return { success: false, error: err.message || 'Search failed' };
  }
});

ipcMain.handle('search:openFile', async (event, filePath) => {
  console.log('Opening file:', filePath);
  try {
    await shell.openPath(filePath);
    return { success: true, message: `Opened ${filePath}` };
  } catch (err: any) {
    console.error('Failed to open file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('search:addFavorite', async (event, item) => {
  console.log('Adding to favorites:', item);
  // Todo: call favoritesRepo.add(item)
  // For now we trust frontend to call favorites store/service which might call this IPC
  // Check if we need a repo for favorites. task.md said "favorites (nếu có nút Save) id, type...". 
  // We added table to db.ts. We need favorites.repo.ts potentially or just direct DB insert here.
  // Let's assume for MVP we might skip complex Fav logic unless requested.
  // User asked "Save purpose: lưu vào Favorites... insert into table favorites".
  // So I should implement it.
  const { v4: uuidv4 } = require('uuid');
  const { getDb } = require('../../services/storage/db');

  try {
    const db = getDb();
    const id = uuidv4();
    db.prepare("INSERT INTO favorites (id, type, refJson, createdAt) VALUES (?, ?, ?, ?)").run(
      id,
      item.type || 'SNIPPET', // DOCUMENT|SNIPPET|ANSWER
      JSON.stringify(item),
      Date.now()
    );
    return { success: true };
  } catch (err: any) {
    console.error('Failed to add favorite:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('search:sendToAsk', async (event, { query, context }) => {
  console.log('Sending to Ask:', query, context);
  // In a real app, this might switch tab or push to a store available to Ask page.
  // Since frontend handles routing, backend just acknowledges.
  return { success: true };
});

ipcMain.handle('search:getPreview', async (event, { fileId, chunkId }) => {
  // 7) Preview pane bên phải lấy dữ liệu thế nào?
  // Node query SQLite: lấy chunk text + offsets, lấy file metadata
  try {
    const file = filesRepo.getById(fileId);
    if (!file) throw new Error('File not found');

    const { getDb } = require('../../services/storage/db');
    const db = getDb();

    let chunk;
    if (chunkId && chunkId.includes('_')) {
      // chunkId is fileId_chunkIndex
      const parts = chunkId.split('_');
      if (parts.length >= 2) {
        const index = parseInt(parts[parts.length - 1]);
        if (!isNaN(index)) {
          chunk = db.prepare("SELECT * FROM chunks WHERE fileId = ? AND chunkIndex = ?").get(fileId, index);
        }
      }
    }

    if (!chunk && chunkId) {
      // Try fetching by ID directly if it was UUID (but we standardized on determinstic)
      chunk = db.prepare("SELECT * FROM chunks WHERE id = ?").get(chunkId);
    }

    // If no specific chunk, maybe just read file content (first 1000 chars)?
    // User said: "highlight đoạn match (keyword) hoặc highlight chunk trả về (semantic)"

    const content = chunk ? chunk.text : (await require('fs').promises.readFile(file.path, 'utf-8')).substring(0, 2000);

    return {
      success: true,
      data: {
        content,
        file,
        chunk
      }
    };

  } catch (err: any) {
    console.error('Preview error:', err);
    return { success: false, error: err.message };
  }
});
