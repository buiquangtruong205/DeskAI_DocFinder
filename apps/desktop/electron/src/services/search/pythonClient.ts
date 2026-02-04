// import { net } from 'electron';

const PYTHON_API_URL = 'http://localhost:8000'; // TODO: Make configurable

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
            const response = await fetch(`${PYTHON_API_URL}/index`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunks })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Python indexing failed: ${text}`);
            }

            const res = await response.json();
            console.log(`Python indexed ${res.indexed_count} chunks`);

        } catch (err) {
            console.error('Failed to send chunks to Python:', err);
            // Don't crash main process, but log error
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
