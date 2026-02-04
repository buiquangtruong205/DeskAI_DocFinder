// Favorites Types
export type FavoriteKind = 'DOCUMENT' | 'SNIPPET' | 'ANSWER';

export interface DocumentRef {
    fileId: string;
}

export interface SnippetRef {
    fileId: string;
    chunkId: string;
    snippet: string;
    start?: number; // optional, for display
    end?: number;   // optional, for display
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

// DB Row Structure
export interface FavoriteDB {
    id: string;
    kind: string; // 'DOCUMENT' | 'SNIPPET' | 'ANSWER'
    title: string | null;
    ref_json: string;
    tags_json: string;
    pinned: number; // 0 or 1
    created_at_ms: number;
    updated_at_ms: number;
    used_count: number;
}

// Application Domain Interface
export interface Favorite {
    id: string;
    kind: FavoriteKind;
    title: string;
    ref: FavoriteRef;
    tags: string[];
    pinned: boolean;
    usedCount: number;
    createdAt: number; // timestamp ms
    updatedAt: number; // timestamp ms
    // Optional computed fields for UI convenience
    filePath?: string; // resolved at runtime if possible, or null
    preview?: string;
}

export interface AddFavoritePayload {
    kind: FavoriteKind;
    title?: string; // optional, user can rename
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

// Folders (Optional v2 - keeping structure if needed but focusing on main first)
export interface FavoriteFolder {
    id: string;
    name: string;
    icon?: string;
    createdAt: string;
}
