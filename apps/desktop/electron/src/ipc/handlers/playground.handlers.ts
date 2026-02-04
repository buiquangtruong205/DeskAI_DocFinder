import { ipcMain } from 'electron';

export const registerPlaygroundHandlers = () => {
    ipcMain.handle('playground:run', async (event, request) => {
        console.log('Playground run request:', JSON.stringify(request, null, 2));

        // Simulate network/processing delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const { prompt, retrieval, generation } = request;

        // Mock response based on inputs
        const mockAnswers: Record<string, string> = {
            'concise': `Redis is an in-memory data structure store used as a database, cache, and message broker. It supports strings, hashes, lists, sets, and more. Key features include high performance, replication, and persistence options.`,
            'detailed': `Redis (Remote Dictionary Server) is an open-source, in-memory data structure store. It is widely used as a database, cache, and message broker.
            
Key Features:
- **In-Memory Performance**: Extremely fast read/write operations.
- **Data Structures**: Supports strings, hashes, lists, sets, sorted sets, bitmaps, hyperloglogs, and geospatial indexes.
- **Persistence**: functionality to save data to disk via RDB snapshots or AOF logs.
- **Replication**: Master-slave replication for high availability.

It is often chosen for real-time applications, caching session data, and message queuing systems.`,
            'bullet_points': `- **Type**: In-memory data structure store
- **Uses**: Database, Cache, Message Broker
- **Performance**: High throughput, low latency
- **Features**: Persistence, Replication, Lua scripting, Transactions`
        };

        const style = generation.answerStyle || 'detailed';
        const answer = mockAnswers[style] || mockAnswers['detailed'];

        // Mock retrieved chunks
        const retrievedChunks = [
            {
                id: 'chunk-1',
                fileName: 'Redis_Caching.md',
                filePath: '/docs/backend/Redis_Caching.md',
                content: 'Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache, and message broker.',
                score: 0.92,
                highlightRanges: [{ start: 0, end: 5 }]
            },
            {
                id: 'chunk-2',
                fileName: 'Architecture_Overview.pdf',
                filePath: '/docs/architecture/Architecture_Overview.pdf',
                content: 'For our caching layer, we selected Redis due to its support for complex data types and persistence capabilities compared to Memcached.',
                score: 0.85
            },
            {
                id: 'chunk-3',
                fileName: 'Deployment_Guide.md',
                filePath: '/docs/ops/Deployment_Guide.md',
                content: 'Ensure Redis is configured with maxmemory policy set to allkeys-lru for effective caching behavior.',
                score: 0.78
            }
        ];

        // Filter based on topK
        const limitedChunks = retrievedChunks.slice(0, retrieval.topK || 3);

        return {
            answer: answer,
            retrievedChunks: limitedChunks,
            debug: {
                retrievalTimeMs: 120, // Mock time
                generationTimeMs: 450, // Mock time
                tokenUsage: {
                    prompt: 156,
                    completion: 85,
                    total: 241
                },
                modelName: generation.model || 'gpt-4o',
                finalPrompt: `System: ${prompt.system}\n\nUser: ${prompt.user}`
            }
        };
    });
};
