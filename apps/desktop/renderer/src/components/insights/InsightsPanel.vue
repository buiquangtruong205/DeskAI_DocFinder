<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useInsightsStore } from '../../stores/insights.store';
import InsightCard from './InsightCard.vue';

const store = useInsightsStore();
const router = useRouter();

const handleInsightAction = (action: string, params?: any) => {
    switch (action) {
        case 'openDocument':
            // Navigate to documents tab with document selected
            router.push({ name: 'documents', query: { doc: params?.id } });
            break;
        case 'showNoResults':
            // Could open a modal or navigate to a dedicated view
            // For now, stays on insights
            console.log('Show no-result queries');
            break;
        case 'filterUnused':
            // Navigate to documents tab with unused filter
            router.push({ name: 'documents', query: { filter: 'unused' } });
            break;
        case 'reindexOutdated':
            // Trigger reindex action
            console.log('Reindex outdated documents');
            break;
        default:
            console.log('Unknown action:', action, params);
    }
};
</script>

<template>
    <div class="space-y-4 overflow-y-auto pr-2">
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>💡</span>
                Insights & Recommendations
            </h3>

            <!-- Loading state -->
            <div v-if="store.loading && !store.insights.length" class="space-y-3">
                <div v-for="i in 3" :key="i" class="animate-pulse p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div class="flex-1">
                            <div class="w-24 h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                            <div class="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else-if="!store.insights.length" class="py-8 text-center">
                <span class="text-4xl">🔍</span>
                <p class="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                    Not enough data to generate insights yet.
                </p>
                <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Use Search and Ask AI to generate insights.
                </p>
            </div>

            <!-- Insight Cards -->
            <div v-else class="space-y-3">
                <InsightCard 
                    v-for="insight in store.insights" 
                    :key="insight.id"
                    :insight="insight"
                    @action="handleInsightAction"
                />
            </div>
        </div>

        <!-- No-Result Queries Section -->
        <div 
            v-if="store.noResultQueries.length > 0" 
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>❓</span>
                Queries with No Results
            </h3>

            <div class="space-y-2">
                <div 
                    v-for="query in store.noResultQueries.slice(0, 5)" 
                    :key="query.id"
                    class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                >
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        "{{ query.query }}"
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                        {{ query.count }}x
                    </span>
                </div>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Consider adding documentation for these topics.
            </p>
        </div>
    </div>
</template>
