// Favorites Service - Frontend API layer
import { invoke } from './desktopApi';

// ========== Types ==========

export type FavoriteKind = 'DOCUMENT' | 'SNIPPET' | 'ANSWER';

export interface DocumentRef {
    fileId: string;
}

export interface SnippetRef {
    fileId: string;
    chunkId: string;
    snippet: string;
    start?: number;
    end?: number;
}

export interface AnswerRef {
    conversationId: string;
    answerId: string;
    citations: Array<{
        fileId: string;
        chunkId: string;
    }>;
}

export type FavoriteRef = DocumentRef | SnippetRef | AnswerRef;

export interface Favorite {
    id: string;
    kind: FavoriteKind;
    title: string;
    ref: FavoriteRef;
    tags: string[];
    pinned: boolean; // boolean from API (repo maps it)
    usedCount: number;
    createdAt: number;
    updatedAt: number;
    // Optional computed fields for UI convenience
    filePath?: string;
    preview?: string;
}

export interface FavoriteFolder {
    id: string;
    name: string;
    icon?: string;
    createdAt: string;
}

export interface AddFavoritePayload {
    kind: FavoriteKind;
    title?: string;
    ref: FavoriteRef;
    tags?: string[];
}

export interface UpdateFavoritePayload {
    title?: string;
    tags?: string[];
    pinned?: boolean;
}

export interface FavoriteFilters {
    kind?: FavoriteKind | 'all';
    pinned?: boolean;
    tags?: string[];
    search?: string;
}

export type FavoriteSort = 'recent' | 'used' | 'title' | 'kind';

// ========== API Responses ==========

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// ========== API Functions ==========

export async function listFavorites(
    filters?: FavoriteFilters,
    sort?: FavoriteSort
): Promise<Favorite[]> {
    const response: ApiResponse<Favorite[]> = await invoke('favorites:list', { filters, sort });
    if (!response.success) {
        throw new Error(response.error || 'Failed to list favorites');
    }
    return response.data || [];
}

export async function addFavorite(payload: AddFavoritePayload): Promise<Favorite> {
    const response: ApiResponse<Favorite> = await invoke('favorites:add', payload);
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add favorite');
    }
    return response.data;
}

export async function updateFavorite(
    id: string,
    patch: UpdateFavoritePayload
): Promise<Favorite> {
    const response: ApiResponse<Favorite> = await invoke('favorites:update', { id, patch });
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update favorite');
    }
    return response.data;
}

export async function removeFavorite(id: string): Promise<void> {
    const response: ApiResponse<void> = await invoke('favorites:remove', id);
    if (!response.success) {
        throw new Error(response.error || 'Failed to remove favorite');
    }
}

export async function openFavorite(id: string): Promise<Favorite> {
    const response: ApiResponse<Favorite> = await invoke('favorites:open', id);
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to open favorite');
    }
    return response.data;
}

export async function getTags(): Promise<{ tags: string[]; counts: Record<string, number> }> {
    const response: ApiResponse<{ tags: string[]; counts: Record<string, number> }> =
        await invoke('favorites:tags');
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get tags');
    }
    return response.data;
}

// ========== Folder APIs (Mock) ==========

export async function listFolders(): Promise<FavoriteFolder[]> {
    const response: ApiResponse<FavoriteFolder[]> = await invoke('favorites:folders:list');
    return response.success && response.data ? response.data : [];
}

export async function createFolder(name: string, icon?: string): Promise<FavoriteFolder> {
    const response: ApiResponse<FavoriteFolder> = await invoke('favorites:folders:create', { name, icon });
    if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create folder');
    }
    return response.data;
}

export async function deleteFolder(id: string): Promise<void> {
    const response: ApiResponse<void> = await invoke('favorites:folders:delete', id);
    if (!response.success) {
        throw new Error(response.error || 'Failed to delete folder');
    }
}

// ========== Helper - Add from Search Result ==========

export function createDocumentFavoritePayload(
    name: string,
    fileId: string,
    tags?: string[]
): AddFavoritePayload {
    return {
        kind: 'DOCUMENT',
        title: name,
        ref: { fileId }, // Only fileId needed
        tags
    };
}

export function createSnippetFavoritePayload(
    title: string,
    fileId: string,
    chunkId: string,
    snippet: string,
    start?: number,
    end?: number,
    tags?: string[]
): AddFavoritePayload {
    return {
        kind: 'SNIPPET',
        title,
        ref: { fileId, chunkId, snippet, start, end },
        tags
    };
}

export function createAnswerFavoritePayload(
    question: string,
    conversationId: string,
    answerId: string,
    citations: AnswerRef['citations'],
    tags?: string[]
): AddFavoritePayload {
    return {
        kind: 'ANSWER',
        title: `Answer: "${question.slice(0, 50)}${question.length > 50 ? '...' : ''}"`,
        ref: { conversationId, answerId, citations },
        tags
    };
}
