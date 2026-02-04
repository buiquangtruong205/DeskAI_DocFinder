// Insights IPC handlers - Analytics and usage statistics
import { ipcMain, IpcMainInvokeEvent } from 'electron';

// Types
export type TimeRange = 'today' | '7days' | '30days' | 'custom';

export interface UsageDataPoint {
    date: string;
    searches: number;
    askAi: number;
}

export interface TopDocument {
    id: string;
    name: string;
    path: string;
    accessCount: number;
    lastAccessed: string;
}

export interface TopicStat {
    tag: string;
    count: number;
    percentage: number;
}

export interface SourceStat {
    sourceId: string;
    name: string;
    accessCount: number;
    documentCount: number;
    isActive: boolean;
}

export interface NoResultQuery {
    id: string;
    query: string;
    count: number;
    lastAsked: string;
}

export interface KpiSummary {
    totalDocuments: number;
    indexedFiles: number;
    searchesPerformed: number;
    aiQuestionsAsked: number;
    topUsedDocs: number;
    noResultSearches: number;
}

export interface InsightCard {
    id: string;
    type: 'info' | 'warning' | 'success' | 'danger';
    icon: string;
    title: string;
    message: string;
    cta?: {
        label: string;
        action: string;
        params?: any;
    };
}

// Helper to generate dates for mock data
function generateDateRange(range: TimeRange): string[] {
    const dates: string[] = [];
    const now = new Date();
    let days = 1;

    switch (range) {
        case 'today':
            days = 1;
            break;
        case '7days':
            days = 7;
            break;
        case '30days':
            days = 30;
            break;
        default:
            days = 7;
    }

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
}

// Mock data generators
function generateMockUsageData(range: TimeRange): UsageDataPoint[] {
    const dates = generateDateRange(range);
    return dates.map(date => ({
        date,
        searches: Math.floor(Math.random() * 30) + 5,
        askAi: Math.floor(Math.random() * 15) + 2
    }));
}

function generateMockTopDocuments(): TopDocument[] {
    return [
        { id: '1', name: 'Redis_Caching.md', path: 'C:/Projects/backend-docs/redis/Redis_Caching.md', accessCount: 42, lastAccessed: '2026-02-03T06:30:00Z' },
        { id: '2', name: 'API_Authentication.md', path: 'C:/Projects/backend-docs/auth/API_Authentication.md', accessCount: 28, lastAccessed: '2026-02-02T14:20:00Z' },
        { id: '3', name: 'database_schema.sql', path: 'C:/Projects/backend-docs/database/database_schema.sql', accessCount: 19, lastAccessed: '2026-02-02T10:15:00Z' },
        { id: '4', name: 'ML_Research_Paper.pdf', path: 'C:/Research/papers/ML_Research_Paper.pdf', accessCount: 15, lastAccessed: '2026-02-01T16:45:00Z' },
        { id: '6', name: 'meeting_notes.txt', path: 'C:/Notes/project-notes/meeting_notes.txt', accessCount: 11, lastAccessed: '2026-02-03T07:00:00Z' },
        { id: '7', name: 'utils.py', path: 'C:/Projects/backend-docs/utils/utils.py', accessCount: 8, lastAccessed: '2026-01-30T11:20:00Z' },
        { id: '8', name: 'config.json', path: 'C:/Projects/backend-docs/config/config.json', accessCount: 5, lastAccessed: '2026-01-29T15:45:00Z' }
    ];
}

function generateMockTopicStats(): TopicStat[] {
    const topics = [
        { tag: 'redis', count: 42 },
        { tag: 'backend', count: 38 },
        { tag: 'auth', count: 28 },
        { tag: 'database', count: 24 },
        { tag: 'api', count: 19 },
        { tag: 'python', count: 12 },
        { tag: 'config', count: 8 }
    ];

    const total = topics.reduce((sum, t) => sum + t.count, 0);
    return topics.map(t => ({
        ...t,
        percentage: Math.round((t.count / total) * 100)
    }));
}

function generateMockSourceStats(): SourceStat[] {
    return [
        { sourceId: '1', name: 'backend-docs', accessCount: 89, documentCount: 5, isActive: true },
        { sourceId: '2', name: 'research-papers', accessCount: 17, documentCount: 2, isActive: true },
        { sourceId: '3', name: 'project-notes', accessCount: 11, documentCount: 1, isActive: true },
        { sourceId: '4', name: 'old-archives', accessCount: 0, documentCount: 12, isActive: false }
    ];
}

function generateMockNoResultQueries(): NoResultQuery[] {
    return [
        { id: '1', query: 'docker deployment', count: 5, lastAsked: '2026-02-03T08:00:00Z' },
        { id: '2', query: 'kubernetes setup', count: 4, lastAsked: '2026-02-02T15:30:00Z' },
        { id: '3', query: 'unit testing best practices', count: 3, lastAsked: '2026-02-02T11:00:00Z' },
        { id: '4', query: 'CI/CD pipeline', count: 3, lastAsked: '2026-02-01T09:45:00Z' },
        { id: '5', query: 'microservices architecture', count: 2, lastAsked: '2026-01-31T14:20:00Z' }
    ];
}

function generateMockKpiSummary(range: TimeRange): KpiSummary {
    const multiplier = range === 'today' ? 1 : range === '7days' ? 7 : 30;
    return {
        totalDocuments: 142,
        indexedFiles: 128,
        searchesPerformed: Math.floor(18 * multiplier * (0.8 + Math.random() * 0.4)),
        aiQuestionsAsked: Math.floor(6 * multiplier * (0.8 + Math.random() * 0.4)),
        topUsedDocs: 28,
        noResultSearches: Math.floor(2 * multiplier * (0.8 + Math.random() * 0.4))
    };
}

function generateMockInsights(range: TimeRange): InsightCard[] {
    const insights: InsightCard[] = [
        {
            id: '1',
            type: 'info',
            icon: '💡',
            title: 'Top Performer',
            message: 'Your document "Redis_Caching.md" accounts for 32% of all searches. Consider creating related documentation.',
            cta: {
                label: 'View document',
                action: 'openDocument',
                params: { id: '1' }
            }
        },
        {
            id: '2',
            type: 'warning',
            icon: '⚠️',
            title: 'No Results Found',
            message: `${range === 'today' ? '5' : range === '7days' ? '17' : '48'} search queries returned no results. Consider adding documentation for these topics.`,
            cta: {
                label: 'Review queries',
                action: 'showNoResults'
            }
        },
        {
            id: '3',
            type: 'danger',
            icon: '📉',
            title: 'Low Usage Alert',
            message: '42 documents have not been accessed in the last 30 days. Consider reviewing or archiving them.',
            cta: {
                label: 'Review unused docs',
                action: 'filterUnused'
            }
        },
        {
            id: '4',
            type: 'success',
            icon: '📈',
            title: 'Usage Growing',
            message: 'Search activity increased by 23% compared to the previous period. Your knowledge base is getting more valuable!',
        },
        {
            id: '5',
            type: 'info',
            icon: '🔄',
            title: 'Re-index Suggested',
            message: '3 documents have been modified since last indexing. Re-index to ensure search accuracy.',
            cta: {
                label: 'Re-index now',
                action: 'reindexOutdated'
            }
        }
    ];

    // Return a subset based on range
    return range === 'today' ? insights.slice(0, 3) : insights;
}

// IPC Handlers
ipcMain.handle('insights:getUsageStats', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockUsageData(range);
});

ipcMain.handle('insights:getTopDocuments', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return generateMockTopDocuments();
});

ipcMain.handle('insights:getTopicStats', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return generateMockTopicStats();
});

ipcMain.handle('insights:getSourceStats', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return generateMockSourceStats();
});

ipcMain.handle('insights:getNoResultQueries', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return generateMockNoResultQueries();
});

ipcMain.handle('insights:getKpiSummary', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return generateMockKpiSummary(range);
});

ipcMain.handle('insights:getAutoInsights', async (_event: IpcMainInvokeEvent, range: TimeRange) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockInsights(range);
});

console.log('Insights IPC handlers registered');
