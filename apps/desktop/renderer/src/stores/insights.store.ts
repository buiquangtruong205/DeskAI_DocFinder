// Insights Store - State management for analytics and usage statistics
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as insightsService from '../services/insights.service';
import type {
    TimeRange,
    UsageDataPoint,
    TopDocument,
    TopicStat,
    SourceStat,
    NoResultQuery,
    KpiSummary,
    InsightCard
} from '../services/insights.service';

export type { TimeRange, UsageDataPoint, TopDocument, TopicStat, SourceStat, NoResultQuery, KpiSummary, InsightCard };

export const useInsightsStore = defineStore('insights', () => {
    // State
    const timeRange = ref<TimeRange>('7days');
    const kpiSummary = ref<KpiSummary | null>(null);
    const usageData = ref<UsageDataPoint[]>([]);
    const topDocuments = ref<TopDocument[]>([]);
    const topicStats = ref<TopicStat[]>([]);
    const sourceStats = ref<SourceStat[]>([]);
    const noResultQueries = ref<NoResultQuery[]>([]);
    const insights = ref<InsightCard[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Computed
    const hasData = computed(() =>
        usageData.value.length > 0 ||
        topDocuments.value.length > 0 ||
        kpiSummary.value !== null
    );

    const totalSearches = computed(() =>
        usageData.value.reduce((sum, d) => sum + d.searches, 0)
    );

    const totalAskAi = computed(() =>
        usageData.value.reduce((sum, d) => sum + d.askAi, 0)
    );

    const activeSourcesCount = computed(() =>
        sourceStats.value.filter(s => s.isActive).length
    );

    const inactiveSourcesCount = computed(() =>
        sourceStats.value.filter(s => !s.isActive).length
    );

    // Actions
    async function setTimeRange(range: TimeRange) {
        timeRange.value = range;
        await fetchAllData();
    }

    async function fetchAllData() {
        loading.value = true;
        error.value = null;

        try {
            const range = timeRange.value;

            // Fetch all data in parallel
            const [
                kpiResult,
                usageResult,
                topDocsResult,
                topicsResult,
                sourcesResult,
                noResultResult,
                insightsResult
            ] = await Promise.all([
                insightsService.getKpiSummary(range),
                insightsService.getUsageStats(range),
                insightsService.getTopDocuments(range),
                insightsService.getTopicStats(range),
                insightsService.getSourceStats(range),
                insightsService.getNoResultQueries(range),
                insightsService.getAutoInsights(range)
            ]);

            kpiSummary.value = kpiResult;
            usageData.value = usageResult;
            topDocuments.value = topDocsResult;
            topicStats.value = topicsResult;
            sourceStats.value = sourcesResult;
            noResultQueries.value = noResultResult;
            insights.value = insightsResult;
        } catch (err: any) {
            error.value = err.message || 'Failed to load insights data';
            console.error('Failed to fetch insights:', err);
        } finally {
            loading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    return {
        // State
        timeRange,
        kpiSummary,
        usageData,
        topDocuments,
        topicStats,
        sourceStats,
        noResultQueries,
        insights,
        loading,
        error,

        // Computed
        hasData,
        totalSearches,
        totalAskAi,
        activeSourcesCount,
        inactiveSourcesCount,

        // Actions
        setTimeRange,
        fetchAllData,
        clearError
    };
});
