<script setup lang="ts">
import { computed } from 'vue';
import { useInsightsStore } from '../../stores/insights.store';
import KpiCard from './KpiCard.vue';

const store = useInsightsStore();

const kpiCards = computed(() => {
    if (!store.kpiSummary) return [];
    
    const kpi = store.kpiSummary;
    return [
        {
            icon: '📄',
            label: 'Total Documents',
            value: kpi.totalDocuments,
            sublabel: `${kpi.indexedFiles} indexed`,
            color: 'blue' as const
        },
        {
            icon: '🔍',
            label: 'Searches',
            value: kpi.searchesPerformed,
            sublabel: store.timeRange === 'today' ? 'today' : `last ${store.timeRange === '7days' ? '7 days' : '30 days'}`,
            color: 'purple' as const,
            trend: 'up' as const,
            trendValue: '+12%'
        },
        {
            icon: '💬',
            label: 'AI Questions',
            value: kpi.aiQuestionsAsked,
            sublabel: 'asked to AI',
            color: 'green' as const
        },
        {
            icon: '⭐',
            label: 'Active Docs',
            value: `${kpi.topUsedDocs} / ${kpi.totalDocuments}`,
            sublabel: 'used recently',
            color: 'orange' as const
        },
        {
            icon: '❌',
            label: 'No Results',
            value: kpi.noResultSearches,
            sublabel: 'searches with no hits',
            color: kpi.noResultSearches > 10 ? 'red' as const : 'gray' as const
        }
    ];
});
</script>

<template>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 bg-gray-50 dark:bg-gray-900/50">
        <!-- Loading skeleton -->
        <template v-if="store.loading && !store.kpiSummary">
            <div 
                v-for="i in 5" 
                :key="i"
                class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 animate-pulse"
            >
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div class="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div class="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
            </div>
        </template>

        <!-- KPI Cards -->
        <KpiCard
            v-for="card in kpiCards"
            :key="card.label"
            :icon="card.icon"
            :label="card.label"
            :value="card.value"
            :sublabel="card.sublabel"
            :color="card.color"
            :trend="card.trend"
            :trend-value="card.trendValue"
        />
    </div>
</template>
