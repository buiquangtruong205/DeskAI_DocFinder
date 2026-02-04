import { chunksRepo } from '../storage/repositories/chunks.repo';
import { pythonClient } from './pythonClient';
import { filesRepo } from '../storage/repositories/files.repo';

export interface SearchOptions {
    mode: 'keyword' | 'semantic' | 'hybrid';
    topK?: number;
    filters?: Record<string, any>;
}

export interface SearchResult {
    id: string;
    fileId: string;
    chunkId?: string;
    title: string;
    path: string;
    snippet: string;
    score: number;
    matchType: 'keyword' | 'semantic' | 'hybrid';
    tags?: string[];
    sourceId?: string;
}

export const searchService = {
    async search(query: string, options: SearchOptions = { mode: 'hybrid' }): Promise<{ results: SearchResult[], stats: { time: number, total: number } }> {
        const startTime = Date.now();
        const topK = options.topK || 20;
        const mode = options.mode;

        let results: SearchResult[] = [];

        // 0. Empty Query - Return recent/all files
        console.log('[SearchService] Search called with query:', `"${query}"`, 'Mode:', options?.mode);
        if (!query || !query.trim()) {
            console.log('[SearchService] Empty query detected. Fetching default files.');
            const sourceId = options.filters?.source === 'all' ? undefined : options.filters?.source;
            const type = options.filters?.type === 'all' ? undefined : options.filters?.type;

            const files = filesRepo.list({
                sourceId,
                type,
                limit: topK
            });
            console.log(`[SearchService] Found ${files.length} default files.`);

            results = files.map(f => ({
                id: f.id,
                fileId: f.id,
                chunkId: undefined,
                title: f.name,
                path: f.path,
                snippet: '',
                score: 1,
                matchType: 'keyword',
                sourceId: f.sourceId || undefined
            }));

            return {
                results,
                stats: {
                    time: Date.now() - startTime,
                    total: results.length // This is just page limit, proper total needed? For defaults, page limit is fine.
                }
            };
        }

        // 1. Keyword Search
        let kwResults: any[] = [];
        if (mode === 'keyword' || mode === 'hybrid') {
            kwResults = chunksRepo.searchKeyword(query, topK); // returns {chunkId, fileId, score, snippet...}
        }

        // 2. Semantic Search
        let semResults: any[] = [];
        if (mode === 'semantic' || mode === 'hybrid') {
            semResults = await pythonClient.search(query, undefined, topK);
            // semResults are [{id, score, metadata: {fileId, chunkIndex...}}]
        }

        // 3. Merge Strategies
        if (mode === 'keyword') {
            results = this.mapKwResults(kwResults);
        } else if (mode === 'semantic') {
            results = await this.mapSemResults(semResults);
        } else {
            results = await this.mergeHybrid(kwResults, semResults, topK);
        }

        return {
            results,
            stats: {
                time: Date.now() - startTime,
                total: results.length // This is limited by TopK/ranking.
            }
        };
    },

    mapKwResults(kwResults: any[]): SearchResult[] {
        return kwResults.map(r => ({
            id: r.chunkId,
            fileId: r.fileId,
            chunkId: r.chunkId,
            title: r.name,
            path: r.path,
            snippet: r.text, // TODO: generate snippet
            score: r.score, // bm25 raw score, might need norm
            matchType: 'keyword',
            sourceId: r.sourceId
        }));
    },

    async mapSemResults(semResults: any[]): Promise<SearchResult[]> {
        // Semantic results only have metadata, need to join with File info from DB
        const results: SearchResult[] = [];
        for (const r of semResults) {
            const fileId = r.metadata.fileId;
            const file = filesRepo.getById(fileId);
            if (file) {
                // Fetch chunk text if not in metadata? Python stores text? 
                // We sent text to python, so we could assume we get it back or metadata has it.
                // If not, we fetch from chunksRepo by fileId+index
                // For now, let's assume we need to join.

                results.push({
                    id: `sem-${r.id}`,
                    fileId: file.id,
                    chunkId: `sem-${r.id}`, // pseudo ID
                    title: file.name,
                    path: file.path,
                    snippet: "Semantic match...", // We need text from DB ideally
                    score: r.score,
                    matchType: 'semantic',
                    sourceId: file.sourceId || undefined
                });
            }
        }
        return results;
    },

    async mergeHybrid(kwResults: any[], semResults: any[], limit: number): Promise<SearchResult[]> {
        // RRF (Reciprocal Rank Fusion)
        const k = 60;
        const scores = new Map<string, number>();
        const itemMap = new Map<string, any>();

        // 1. Process Keyword Results
        kwResults.forEach((r, idx) => {
            const key = r.chunkId; // Should be 'fileId_chunkIndex'
            const rrfScore = 1 / (k + idx + 1);
            scores.set(key, (scores.get(key) || 0) + rrfScore);

            itemMap.set(key, {
                ...r,
                matchType: 'keyword',
                // Keep original score for debug if needed, but RRF overrides it
            });
        });

        // 2. Process Semantic Results
        // r is { chunk_id, file_id, score, snippet, payload }
        for (let i = 0; i < semResults.length; i++) {
            const r = semResults[i];
            const key = r.chunk_id; // 'fileId_chunkIndex'
            const rrfScore = 1 / (k + i + 1);

            const existingScore = scores.get(key) || 0;
            scores.set(key, existingScore + rrfScore);

            const existingItem = itemMap.get(key);

            if (existingItem) {
                // If it existed in Keyword, upgrade to Hybrid
                existingItem.matchType = 'hybrid';
                // Maybe update snippet if semantic snippet is better? 
                // Usually keyword snippet (with highlight) is preferred for display if available.
            } else {
                // New semantic-only match
                // Need to fetch file details if not present in payload fully
                // Payload has: title, path, snippet.
                itemMap.set(key, {
                    id: key,
                    fileId: r.file_id || r.payload?.file_id,
                    chunkId: key,
                    title: r.payload?.title || 'Unknown',
                    path: r.payload?.path || 'Unknown',
                    snippet: r.snippet || r.payload?.snippet || '',
                    score: 0, // placeholder
                    matchType: 'semantic',
                    sourceId: r.payload?.source_id,
                    tags: r.payload?.tags
                });
            }
        }

        // 3. Convert to Array and Sort
        const merged: SearchResult[] = [];
        for (const [key, score] of scores) {
            const item = itemMap.get(key);
            if (item) {
                merged.push({
                    id: key,
                    fileId: item.fileId,
                    chunkId: key,
                    title: item.title,
                    path: item.path,
                    snippet: item.snippet,
                    score: score,
                    matchType: item.matchType,
                    sourceId: item.sourceId,
                    tags: item.tags
                });
            }
        }

        merged.sort((a, b) => b.score - a.score);
        return merged.slice(0, limit);
    }
};
