<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInsightsStore } from '../stores/insights.store';
import InsightsHeader from '../components/insights/InsightsHeader.vue';
import KpiCards from '../components/insights/KpiCards.vue';
import ChartsPanel from '../components/insights/ChartsPanel.vue';
import InsightsPanel from '../components/insights/InsightsPanel.vue';

const store = useInsightsStore();
const router = useRouter();

onMounted(() => {
    store.fetchAllData();
});

const goToSearch = () => {
    router.push({ name: 'search' });
};

const retry = () => {
    store.clearError();
    store.fetchAllData();
};
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
        <!-- Header -->
        <InsightsHeader />

        <!-- Error State -->
        <div 
            v-if="store.error" 
            class="flex-1 flex flex-col items-center justify-center p-6"
        >
            <div class="text-center max-w-md">
                <span class="text-6xl">⚠️</span>
                <h2 class="text-xl font-semibold mt-4 text-gray-900 dark:text-white">
                    Unable to load insights
                </h2>
                <p class="text-gray-500 dark:text-gray-400 mt-2">
                    {{ store.error }}
                </p>
                <button 
                    @click="retry"
                    class="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>

        <!-- Empty State (no data yet) -->
        <div 
            v-else-if="!store.loading && !store.hasData" 
            class="flex-1 flex flex-col items-center justify-center p-6"
        >
            <div class="text-center max-w-md">
                <span class="text-6xl">📊</span>
                <h2 class="text-xl font-semibold mt-4 text-gray-900 dark:text-white">
                    Not enough data yet
                </h2>
                <p class="text-gray-500 dark:text-gray-400 mt-2">
                    Use Search and Ask AI to generate insights about your knowledge base usage.
                </p>
                <button 
                    @click="goToSearch"
                    class="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                    <span>Go to Search</span>
                    <span>→</span>
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <template v-else>
            <!-- KPI Cards Row -->
            <KpiCards />

            <!-- Two-Column Layout -->
            <div class="flex-1 flex overflow-hidden p-6 gap-6">
                <!-- Left: Charts Panel (60%) -->
                <div class="w-3/5 overflow-hidden">
                    <ChartsPanel />
                </div>

                <!-- Right: Insights Panel (40%) -->
                <div class="w-2/5 overflow-hidden">
                    <InsightsPanel />
                </div>
            </div>
        </template>
    </div>
</template>
