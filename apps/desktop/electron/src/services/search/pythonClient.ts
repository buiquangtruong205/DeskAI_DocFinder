// import { net } from 'electron';

import { logToFile } from '../../utils/fileLogger';

const PYTHON_API_URL = 'http://127.0.0.1:8000'; // Fixed: use IPv4 to avoid Node 18+ fetch issues

let failureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30000; // 30 seconds

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
        if (!chunks.length) return;

        // Circuit breaker check
        if (failureCount >= FAILURE_THRESHOLD && Date.now() - lastFailureTime < COOLDOWN_MS) {
            console.warn('[PythonClient] Circuit breaker active. Skipping request.');
            throw new Error('AI backend is currently unavailable (Circuit Breaker active)');
        }

        const BATCH_SIZE = 50;
        console.log(`[PythonClient] Processing ${chunks.length} chunks in batches of ${BATCH_SIZE}`);

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            try {
                console.log(`[PythonClient] Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per batch

                const response = await fetch(`${PYTHON_API_URL}/index`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chunks: batch }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const text = await response.text();
                    failureCount++;
                    lastFailureTime = Date.now();
                    throw new Error(`Python indexing failed: ${text}`);
                }

                // Success! Reset circuit breaker
                failureCount = 0;
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    failureCount++;
                    lastFailureTime = Date.now();
                    throw new Error(`AI backend request timed out at batch ${i / BATCH_SIZE + 1}`);
                }
                throw err;
            }
        }
    },

    async deleteFile(fileId: string): Promise<void> {
        try {
            console.log(`[PythonClient] Deleting file ${fileId} from AI index`);
            const response = await fetch(`${PYTHON_API_URL}/index/delete/${fileId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[PythonClient] Failed to delete file from AI: ${text}`);
            }
        } catch (err) {
            console.error('[PythonClient] Error calling delete API:', err);
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
