import { invoke } from './desktopApi';
import { addFavorite as addToFavorites, createDocumentFavoritePayload } from './favorites.service';

export interface SearchResultItem {
    id: string;
    name: string;
    path: string;
    type: 'markdown' | 'python' | 'pdf' | 'code' | 'other';
    content?: string;
    tags?: string[];
    score?: number;
    lastModified?: string;
    size?: string;
    sourceId?: string;
    chunkId?: string;
    fileId?: string;
}

export interface SearchStats {
    time: number;
    total: number;
}

export interface SearchResponse {
    results: SearchResultItem[];
    stats?: SearchStats;
}

export async function search(query: string, mode: string = 'hybrid', filters: any = {}): Promise<SearchResponse> {
    const res = await invoke('search:query', { query, options: { mode, filters } });
    if (res.success) {
        return {
            results: res.results || [],
            stats: res.stats // pass stats through
        };
    }
    return { results: [] };
}

export async function getPreview(id: string, filePath: string) {
    // If id contains '_', it's a chunkId (fileId_index). If not, likely fileId.
    // Backend getPreview expects { fileId, chunkId }.
    // If we pass chunkId, backend can derive fileId or we query it. 
    // But passing fileId is safer if we have it? 
    // Item in Store has .id (which is chunkId or fileId) and .fileId.
    // But this function signature only takes (fileId, filePath). 
    // Wait, Store calls: getPreview(item.id, item.path). item.id is usually key (chunkId).
    // So 'fileId' arg here is actually 'itemId'.
    // Let's call it itemId.

    // However, to be robust, we should ideally pass both fileId and chunkId if available.
    // But this service interface is fixed for now?
    // Let's pass { fileId: parsedFileId, chunkId: id }
    // If id is fileId_chunkIndex, fileId is part[0].

    let fileId = id;
    if (id.includes('_')) {
        fileId = id.split('_')[0];
    }
    const res = await invoke('search:getPreview', { fileId, chunkId: id });
    return res.data || { content: '' };
}

export async function openFile(filePath: string) {
    return await invoke('search:openFile', filePath);
}

export async function addFavorite(item: SearchResultItem) {
    // Use the new favorites service
    const payload = createDocumentFavoritePayload(
        item.name,
        item.path,
        item.id,
        item.tags
    );
    return await addToFavorites(payload);
}

export async function sendToAsk(query: string, context: any) {
    return await invoke('search:sendToAsk', { query, context });
}

