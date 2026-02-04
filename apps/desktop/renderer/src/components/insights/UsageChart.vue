<script setup lang="ts">
import { computed } from 'vue';
import { useInsightsStore } from '../../stores/insights.store';
import { formatChartDate } from '../../services/insights.service';

const store = useInsightsStore();

const maxValue = computed(() => {
    if (!store.usageData.length) return 100;
    const maxSearches = Math.max(...store.usageData.map(d => d.searches));
    const maxAsk = Math.max(...store.usageData.map(d => d.askAi));
    return Math.max(maxSearches, maxAsk, 10);
});

const getBarHeight = (value: number) => {
    return (value / maxValue.value) * 100;
};
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📈</span>
            Usage Over Time
        </h3>

        <!-- Loading state -->
        <div v-if="store.loading && !store.usageData.length" class="h-48 flex items-center justify-center">
            <div class="animate-pulse text-gray-400">Loading chart...</div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!store.usageData.length" class="h-48 flex items-center justify-center text-gray-400 text-sm">
            No usage data available
        </div>

        <!-- Chart -->
        <div v-else class="h-48">
            <!-- Legend -->
            <div class="flex items-center gap-4 mb-4 text-xs">
                <div class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span class="text-gray-600 dark:text-gray-400">Searches</span>
                </div>
                <div class="flex items-center gap-1">
                    <div class="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span class="text-gray-600 dark:text-gray-400">AI Questions</span>
                </div>
            </div>

            <!-- Bar Chart -->
            <div class="flex items-end justify-between gap-1 h-32">
                <div 
                    v-for="(day, index) in store.usageData" 
                    :key="index"
                    class="flex-1 flex flex-col items-center gap-0.5"
                >
                    <!-- Bars -->
                    <div class="flex items-end gap-0.5 h-24">
                        <div 
                            class="w-2 bg-blue-500 rounded-t transition-all duration-500 ease-out"
                            :style="{ height: `${getBarHeight(day.searches)}%` }"
                            :title="`${day.searches} searches`"
                        ></div>
                        <div 
                            class="w-2 bg-purple-500 rounded-t transition-all duration-500 ease-out"
                            :style="{ height: `${getBarHeight(day.askAi)}%` }"
                            :title="`${day.askAi} AI questions`"
                        ></div>
                    </div>
                    <!-- Date label -->
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 transform rotate-0">
                        {{ formatChartDate(day.date) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
