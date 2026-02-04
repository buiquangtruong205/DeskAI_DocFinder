// Documents Service - API functions for managing indexed documents via IPC

import { invoke } from './desktopApi';

export interface Document {
    id: string;
    name: string;
    path: string;
    source: string;
    sourceId: string;
    type: 'markdown' | 'pdf' | 'python' | 'code' | 'text' | 'json';
    size: string;
    sizeBytes: number;
    tags: string[];
    isFavorite: boolean;
    status: 'indexed' | 'error' | 'pending';
    lastModified: string;
    lastIndexed: string;
    errorMessage?: string;
    content?: string;
}

export interface FolderNode {
    id: string;
    name: string;
    path: string;
    children: FolderNode[];
    documentCount: number;
    isExpanded?: boolean;
}

export interface DocumentFilters {
    sourceId?: string;
    folderId?: string;
    searchQuery?: string;
    filterType?: 'all' | 'favorites' | 'failed' | 'recent';
    fileType?: string;
}

export interface DocumentSort {
    key: 'name' | 'lastIndexed' | 'lastModified' | 'size';
    order: 'asc' | 'desc';
}

export async function listDocuments(
    filters?: DocumentFilters,
    sort?: DocumentSort
): Promise<Document[]> {
    return await invoke('documents:list', filters, sort);
}

export async function getFolderTree(): Promise<FolderNode[]> {
    return await invoke('documents:getFolderTree');
}

export async function getDocumentPreview(documentId: string): Promise<Document | null> {
    return await invoke('documents:getById', documentId);
}

export async function openDocument(filePath: string): Promise<void> {
    await invoke('documents:open', filePath);
}

export async function revealInExplorer(filePath: string): Promise<void> {
    await invoke('documents:reveal', filePath);
}

export async function reindexDocument(documentId: string): Promise<void> {
    await invoke('documents:reindex', documentId);
}

export async function removeDocument(documentId: string): Promise<void> {
    await invoke('documents:remove', documentId);
}

export async function updateDocumentTags(documentId: string, tags: string[]): Promise<void> {
    // TODO: Implement tags in backend
    console.log('Updating tags for document:', documentId, tags);
}

export async function toggleFavorite(documentId: string): Promise<boolean> {
    return await invoke('documents:toggleFavorite', documentId);
}

export async function bulkReindex(documentIds: string[]): Promise<void> {
    await invoke('documents:bulkReindex', documentIds);
}

export async function bulkRemove(documentIds: string[]): Promise<void> {
    await invoke('documents:bulkRemove', documentIds);
}

export async function bulkAddTags(documentIds: string[], tags: string[]): Promise<void> {
    // TODO: Implement in backend
    console.log('Adding tags to documents:', documentIds, tags);
}

export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
