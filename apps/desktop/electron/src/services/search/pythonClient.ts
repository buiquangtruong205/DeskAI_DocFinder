// import { net } from 'electron';

import { logToFile } from '../../utils/fileLogger';

const PYTHON_API_URL = 'http://127.0.0.1:8000'; // Fixed: use IPv4 to avoid Node 18+ fetch issues

export interface ChunkDTO {
    chunkId: string;
    text: string;
    fileId: string;
    metadata: Record<string, any>;
}

export interface SearchResultDTO {
    chunk_id: string;
    file_id: string;
    score: number;
    snippet?: string;
    payload: Record<string, any>;
}

export interface SearchFilters {
    source_ids?: string[];
    types?: string[];
    tags?: string[];
    from_mtime_ms?: number;
    to_mtime_ms?: number;
}

export const pythonClient = {
    async indexChunks(chunks: ChunkDTO[]): Promise<void> {
        try {
            console.log(`[PythonClient] Sending ${chunks.length} chunks to ${PYTHON_API_URL}/index`);

            // Add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(`${PYTHON_API_URL}/index`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunks }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Python indexing failed: ${text}`);
            }

            const res = await response.json();
            console.log(`[PythonClient] Success: Indexed ${res.indexed_count} chunks`);

        } catch (err: any) {
            console.error('[PythonClient] Failed to send chunks to Python:', err);
            throw err; // Re-throw so Orchestrator handles it as error
        }
    },

    async search(query: string, filters?: SearchFilters, topK: number = 20): Promise<SearchResultDTO[]> {
        try {
            const body = {
                query,
                top_k: topK,
                filters
            };

            const response = await fetch(`${PYTHON_API_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Python search failed: ${text}`);
            }

            const data = await response.json();
            return data.hits;
        } catch (err) {
            console.error('Python search error:', err);
            return [];
        }
    }
};
