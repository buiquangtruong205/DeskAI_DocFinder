// Favorites Repository - SQLite based
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type {
    Favorite,
    FavoriteFilters,
    FavoriteSort,
    AddFavoritePayload,
    UpdateFavoritePayload,
    FavoriteDB,
    FavoriteKind,
    FavoriteFolder
} from '../../../types/favorites.types';

// Helper: Map DB Row to Domain Object
function mapRowToFavorite(row: FavoriteDB): Favorite {
    return {
        id: row.id,
        kind: row.kind as FavoriteKind,
        title: row.title || '', // Fallback, though DB allows null, domain expects string usually? Type says string.
        ref: JSON.parse(row.ref_json),
        tags: JSON.parse(row.tags_json || '[]'),
        pinned: Boolean(row.pinned),
        usedCount: row.used_count,
        createdAt: row.created_at_ms,
        updatedAt: row.updated_at_ms
    };
}

// ========== Favorites CRUD ==========

export function listFavorites(
    filters: FavoriteFilters = {},
    sort: FavoriteSort = 'recent'
): Favorite[] {
    const db = getDb();
    let query = 'SELECT * FROM favorites WHERE 1=1';
    const params: any[] = [];

    // Filters
    if (filters.kind && filters.kind !== 'all') {
        query += ' AND kind = ?';
        params.push(filters.kind);
    }

    if (filters.pinned !== undefined) {
        query += ' AND pinned = ?';
        params.push(filters.pinned ? 1 : 0);
    }

    if (filters.search) {
        query += ' AND (title LIKE ? OR tags_json LIKE ?)';
        const term = `%${filters.search}%`;
        params.push(term, term);
    }

    // Tag filtering involves JSON. For MVP simplicity with SQLite:
    // We'll fetch and filter in-memory if tags are specified, 
    // OR we use LIKE '%"tag"%' hack which is okay for simple tags.
    if (filters.tags && filters.tags.length > 0) {
        // This is a strict "has any tag" or "has all"? usually "has any".
        // Let's use simple LIKE for now for each tag.
        const tagConditions = filters.tags.map((t: string) => 'tags_json LIKE ?').join(' OR ');
        query += ` AND (${tagConditions})`;
        filters.tags.forEach((t: string) => params.push(`%"${t}"%`));
    }

    // Sort
    switch (sort) {
        case 'recent':
            query += ' ORDER BY created_at_ms DESC';
            break;
        case 'used':
            query += ' ORDER BY used_count DESC';
            break;
        case 'title':
            query += ' ORDER BY title ASC';
            break;
        case 'kind':
            query += ' ORDER BY kind ASC, created_at_ms DESC';
            break;
        default:
            query += ' ORDER BY created_at_ms DESC';
    }

    // Pinned always on top is often a UI concern or secondary sort. 
    // If strict requirement: ORDER BY pinned DESC, [sort]...
    // The previous implementation did `results.sort` manually for pinned.
    // Let's add it to SQL:
    if (sort !== 'recent') { // Logic check: usually pinned is top regardless?
        // Let's prepend pinned to the existing ORDER BY
        // Replace "ORDER BY" with "ORDER BY pinned DESC,"
        query = query.replace('ORDER BY', 'ORDER BY pinned DESC,');
    } else {
        // if recent, pinned first too?
        query = query.replace('ORDER BY', 'ORDER BY pinned DESC,');
    }

    const rows = db.prepare(query).all(...params) as FavoriteDB[];

    // Hydrate with File Paths
    const fileIds = new Set<string>();
    rows.forEach(row => {
        try {
            const ref = JSON.parse(row.ref_json);
            if (row.kind === 'DOCUMENT' || row.kind === 'SNIPPET') {
                if (ref.fileId) fileIds.add(ref.fileId);
            }
        } catch (e) { }
    });

    const filePaths: Record<string, string> = {};
    if (fileIds.size > 0) {
        const ids = Array.from(fileIds);
        const placeholders = ids.map(() => '?').join(',');
        const files = db.prepare(`SELECT id, path FROM files WHERE id IN (${placeholders})`).all(...ids) as { id: string, path: string }[];
        files.forEach(f => filePaths[f.id] = f.path);
    }

    return rows.map(row => {
        const fav = mapRowToFavorite(row);
        // Attach filePath if available
        if (fav.kind === 'DOCUMENT' || fav.kind === 'SNIPPET') {
            const fRef = fav.ref as any;
            if (fRef.fileId && filePaths[fRef.fileId]) {
                fav.filePath = filePaths[fRef.fileId];
            }
        }
        return fav;
    });
}

export function addFavorite(payload: AddFavoritePayload): Favorite {
    const db = getDb();
    const id = uuidv4();
    const now = Date.now();

    const row: FavoriteDB = {
        id,
        kind: payload.kind,
        title: payload.title || (payload.ref as any).title || 'Untitled', // Try to get title from ref if missing
        ref_json: JSON.stringify(payload.ref),
        tags_json: JSON.stringify(payload.tags || []),
        pinned: 0,
        created_at_ms: now,
        updated_at_ms: now,
        used_count: 0
    };

    const stmt = db.prepare(`
        INSERT INTO favorites (
            id, kind, title, ref_json, tags_json, pinned, created_at_ms, updated_at_ms, used_count
        ) VALUES (
            @id, @kind, @title, @ref_json, @tags_json, @pinned, @created_at_ms, @updated_at_ms, @used_count
        )
    `);

    stmt.run(row);
    return mapRowToFavorite(row);
}

export function updateFavorite(id: string, patch: UpdateFavoritePayload): Favorite | null {
    const db = getDb();

    // Build update query dynamically
    const updates: string[] = [];
    const params: any = { id };

    // Always update timestamp
    updates.push('updated_at_ms = @updated_at_ms');
    params.updated_at_ms = Date.now();

    if (patch.title !== undefined) {
        updates.push('title = @title');
        params.title = patch.title;
    }
    if (patch.tags !== undefined) {
        updates.push('tags_json = @tags_json');
        params.tags_json = JSON.stringify(patch.tags);
    }
    if (patch.pinned !== undefined) {
        updates.push('pinned = @pinned');
        params.pinned = patch.pinned ? 1 : 0;
    }

    const stmt = db.prepare(`
        UPDATE favorites 
        SET ${updates.join(', ')}
        WHERE id = @id
    `);

    const info = stmt.run(params);

    if (info.changes > 0) {
        return getFavorite(id);
    }
    return null;
}

export function removeFavorite(id: string): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM favorites WHERE id = ?').run(id);
    return info.changes > 0;
}

export function getFavorite(id: string): Favorite | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM favorites WHERE id = ?').get(id) as FavoriteDB | undefined;
    if (!row) return null;
    return mapRowToFavorite(row);
}

export function incrementUsedCount(id: string): void {
    const db = getDb();
    db.prepare(`
        UPDATE favorites 
        SET used_count = used_count + 1, updated_at_ms = ?
        WHERE id = ?
    `).run(Date.now(), id);
}

// ========== Folders (Mock/Placeholder for v2) ==========
// Since DB for folders isn't defined yet, we'll return empty or minimal.
// The user spec said "New folder (optional v2) → (lúc đó cần bảng folders)"
// So for now, we remove Folder support or map it to nothing.

export function listFolders(): FavoriteFolder[] {
    return [];
}

export function createFolder(name: string, icon?: string): FavoriteFolder {
    // throw error or return mock
    throw new Error("Folders not implemented in MVP DB");
}

export function deleteFolder(id: string): boolean {
    return false;
}

// ========== Tags Helpers ==========

export function getAllTags(): string[] {
    // This is inefficient in SQL if tags are JSON. 
    // Better to maintain a separate tags table BUT for MVP with JSON array:
    // Pull all tags_json and aggregate.
    const db = getDb();
    const rows = db.prepare('SELECT tags_json FROM favorites').all() as { tags_json: string }[];

    const allTags = new Set<string>();
    rows.forEach(row => {
        try {
            const tags = JSON.parse(row.tags_json);
            if (Array.isArray(tags)) {
                tags.forEach(t => allTags.add(String(t)));
            }
        } catch (e) { }
    });

    return Array.from(allTags).sort();
}

export function getTagCounts(): Record<string, number> {
    const db = getDb();
    const rows = db.prepare('SELECT tags_json FROM favorites').all() as { tags_json: string }[];

    const counts: Record<string, number> = {};
    rows.forEach(row => {
        try {
            const tags = JSON.parse(row.tags_json);
            if (Array.isArray(tags)) {
                tags.forEach(t => {
                    counts[t] = (counts[t] || 0) + 1;
                });
            }
        } catch (e) { }
    });

    return counts;
}
