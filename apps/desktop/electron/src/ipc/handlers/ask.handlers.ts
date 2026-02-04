import { ipcMain } from 'electron';

export const registerAskHandlers = () => {
    ipcMain.handle('ask:query', async (event, { question, context, mode, options }) => {
        console.log('Ask query received:', { question, mode });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock response generation
        const mockAnswers: Record<string, string> = {
            'default': `Here is a summary based on your documents. \n\nRedis is an open-source, in-memory data structure store, used as a database, cache, and message broker. \n\n### Key Failures:\n- **Performance**: Extremely fast due to in-memory nature.\n- **Data Structures**: Supports strings, hashes, lists, sets, etc.\n- **Persistence**: Can save data to disk via RDB or AOF.\n\nIt is often used for caching session data, full page cache, or message queues.`,
            'summarize': `The documents mainly discuss **Redis** as a caching solution. It highlights the trade-offs between memory usage and speed.`,
        };

        const answer = mockAnswers[mode] || mockAnswers['default'];

        return {
            id: Date.now().toString(),
            answer: answer,
            citations: [
                {
                    id: 'doc-1',
                    name: 'Redis_Caching.md',
                    path: '/docs/backend/Redis_Caching.md',
                    type: 'markdown',
                    snippet: 'Redis improves performance by caching frequently accessed data in memory.',
                    score: 0.95
                },
                {
                    id: 'doc-2',
                    name: 'Database_Comparison.pdf',
                    path: '/docs/architecture/Database_Comparison.pdf',
                    type: 'pdf',
                    snippet: 'Compared to Memcached, Redis pushes more features like persistence and complex types.',
                    score: 0.88
                }
            ],
            followUps: [
                'How do I configure Redis persistence?',
                'Compare Redis vs Memcached',
                'Show me a code example'
            ],
            confidence: 0.92,
            usedTokens: 145
        };
    });
};
