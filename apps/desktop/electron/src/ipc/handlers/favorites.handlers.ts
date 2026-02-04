// Favorites IPC Handlers
import { ipcMain, shell, IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';
import * as favoritesRepo from '../../services/storage/repositories/favorites.repo';
import { filesRepo } from '../../services/storage/repositories/files.repo';
import type {
    FavoriteFilters,
    FavoriteSort,
    AddFavoritePayload,
    UpdateFavoritePayload,
    DocumentRef,
    SnippetRef,
    Favorite
} from '../../types/favorites.types';

// List favorites with optional filters and sort
ipcMain.handle('favorites:list', async (_event: IpcMainInvokeEvent, options?: {
    filters?: FavoriteFilters;
    sort?: FavoriteSort
}) => {
    try {
        const favorites = favoritesRepo.listFavorites(
            options?.filters || {},
            options?.sort || 'recent'
        );
        return { success: true, data: favorites };
    } catch (error: any) {
        console.error('favorites:list error:', error);
        return { success: false, error: error.message };
    }
});

// Add a new favorite
ipcMain.handle('favorites:add', async (_event: IpcMainInvokeEvent, payload: AddFavoritePayload) => {
    try {
        const favorite = favoritesRepo.addFavorite(payload);
        return { success: true, data: favorite };
    } catch (error: any) {
        console.error('favorites:add error:', error);
        return { success: false, error: error.message };
    }
});

// Update a favorite
ipcMain.handle('favorites:update', async (_event: IpcMainInvokeEvent, { id, patch }: {
    id: string;
    patch: UpdateFavoritePayload
}) => {
    try {
        const favorite = favoritesRepo.updateFavorite(id, patch);
        if (!favorite) {
            return { success: false, error: 'Favorite not found' };
        }
        return { success: true, data: favorite };
    } catch (error: any) {
        console.error('favorites:update error:', error);
        return { success: false, error: error.message };
    }
});

// Remove a favorite
ipcMain.handle('favorites:remove', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
        const removed = favoritesRepo.removeFavorite(id);
        return { success: removed, error: removed ? null : 'Favorite not found' };
    } catch (error: any) {
        console.error('favorites:remove error:', error);
        return { success: false, error: error.message };
    }
});

// Open a favorite (file or location)
ipcMain.handle('favorites:open', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
        const favorite = favoritesRepo.getFavorite(id);
        if (!favorite) {
            return { success: false, error: 'Favorite not found' };
        }

        // Increment usage count
        favoritesRepo.incrementUsedCount(id);

        // Open based on kind
        switch (favorite.kind) {
            case 'DOCUMENT': {
                const ref = favorite.ref as DocumentRef;
                if (!ref.fileId) throw new Error('Invalid document reference');

                const file = filesRepo.getById(ref.fileId);
                if (!file) throw new Error('File not found in index');

                if (!fs.existsSync(file.path)) {
                    throw new Error('File not found on disk (missing)');
                }

                await shell.openPath(file.path);
                // Return path so frontend can use it if needed (e.g. for preview)
                return { success: true, data: { ...favorite, filePath: file.path } };
            }
            case 'SNIPPET': {
                const ref = favorite.ref as SnippetRef;
                if (!ref.fileId) throw new Error('Invalid snippet reference');

                const file = filesRepo.getById(ref.fileId);
                if (!file) throw new Error('File not found in index');

                if (!fs.existsSync(file.path)) {
                    throw new Error('File not found on disk (missing)');
                }

                await shell.openPath(file.path);
                // TODO: For snippet, user might want to open and scroll. 
                // shell.openPath just launches app. 
                // Enhanced viewing requires sending an IPC to the renderer to navigate to a Viewer page?
                // But the user endpoint says "shell.openPath(path) (mở file) hoặc mở trong app preview".
                // We'll stick to openPath for now, but return the path data.
                return { success: true, data: { ...favorite, filePath: file.path } };
            }
            case 'ANSWER': {
                // For answers, we'll need to navigate to Ask tab with the conversation
                // This is purely frontend logic, return success so frontend can act.
                return { success: true, data: favorite };
            }
            default:
                return { success: false, error: 'Unknown favorite type' };
        }
    } catch (error: any) {
        console.error('favorites:open error:', error);
        return { success: false, error: error.message };
    }
});

// Get all tags
ipcMain.handle('favorites:tags', async (_event: IpcMainInvokeEvent) => {
    try {
        const tags = favoritesRepo.getAllTags();
        const counts = favoritesRepo.getTagCounts();
        return { success: true, data: { tags, counts } };
    } catch (error: any) {
        console.error('favorites:tags error:', error);
        return { success: false, error: error.message };
    }
});

// List folders (Mock)
ipcMain.handle('favorites:folders:list', async (_event: IpcMainInvokeEvent) => {
    try {
        const folders = favoritesRepo.listFolders();
        return { success: true, data: folders };
    } catch (error: any) {
        console.error('favorites:folders:list error:', error);
        return { success: false, error: error.message };
    }
});

// Create folder (Mock)
ipcMain.handle('favorites:folders:create', async (_event: IpcMainInvokeEvent, { name, icon }: {
    name: string;
    icon?: string
}) => {
    try {
        const folder = favoritesRepo.createFolder(name, icon);
        return { success: true, data: folder };
    } catch (error: any) {
        // console.error('favorites:folders:create error:', error);
        return { success: false, error: 'Folders not implemented' };
    }
});

// Delete folder (Mock)
ipcMain.handle('favorites:folders:delete', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
        const deleted = favoritesRepo.deleteFolder(id);
        return { success: deleted, error: deleted ? null : 'Folder not found' };
    } catch (error: any) {
        // console.error('favorites:folders:delete error:', error);
        return { success: false, error: 'Folders not implemented' };
    }
});
