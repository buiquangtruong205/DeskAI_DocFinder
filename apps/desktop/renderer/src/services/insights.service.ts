// Insights Service - API functions for analytics and usage statistics
import { invoke } from './desktopApi';

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

// API Functions
export async function getUsageStats(range: TimeRange): Promise<UsageDataPoint[]> {
    try {
        return await invoke('insights:getUsageStats', range);
    } catch (error) {
        console.error('Failed to get usage stats:', error);
        return [];
    }
}

export async function getTopDocuments(range: TimeRange): Promise<TopDocument[]> {
    try {
        return await invoke('insights:getTopDocuments', range);
    } catch (error) {
        console.error('Failed to get top documents:', error);
        return [];
    }
}

export async function getTopicStats(range: TimeRange): Promise<TopicStat[]> {
    try {
        return await invoke('insights:getTopicStats', range);
    } catch (error) {
        console.error('Failed to get topic stats:', error);
        return [];
    }
}

export async function getSourceStats(range: TimeRange): Promise<SourceStat[]> {
    try {
        return await invoke('insights:getSourceStats', range);
    } catch (error) {
        console.error('Failed to get source stats:', error);
        return [];
    }
}

export async function getNoResultQueries(range: TimeRange): Promise<NoResultQuery[]> {
    try {
        return await invoke('insights:getNoResultQueries', range);
    } catch (error) {
        console.error('Failed to get no-result queries:', error);
        return [];
    }
}

export async function getKpiSummary(range: TimeRange): Promise<KpiSummary | null> {
    try {
        return await invoke('insights:getKpiSummary', range);
    } catch (error) {
        console.error('Failed to get KPI summary:', error);
        return null;
    }
}

export async function getAutoInsights(range: TimeRange): Promise<InsightCard[]> {
    try {
        return await invoke('insights:getAutoInsights', range);
    } catch (error) {
        console.error('Failed to get insights:', error);
        return [];
    }
}

// Helper to format relative time
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Helper to format date for charts
export function formatChartDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
