<script setup lang="ts">
import { computed } from 'vue';
import { useInsightsStore } from '../../stores/insights.store';

const store = useInsightsStore();

const maxAccessCount = computed(() => {
    if (!store.sourceStats.length) return 100;
    return Math.max(...store.sourceStats.map(s => s.accessCount), 1);
});

const getBarWidth = (count: number) => {
    return (count / maxAccessCount.value) * 100;
};
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📁</span>
            Source Usage
        </h3>

        <!-- Loading state -->
        <div v-if="store.loading && !store.sourceStats.length" class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="flex items-center gap-2 mb-1">
                    <div class="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" :style="{ width: `${70 - i * 15}%` }"></div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!store.sourceStats.length" class="h-32 flex items-center justify-center text-gray-400 text-sm">
            No source usage data
        </div>

        <!-- Source list -->
        <div v-else class="space-y-3">
            <div 
                v-for="source in store.sourceStats" 
                :key="source.sourceId"
                class="group"
            >
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <span class="text-sm">📂</span>
                        <span 
                            class="text-sm text-gray-700 dark:text-gray-300 truncate"
                            :class="{ 'opacity-50': !source.isActive }"
                        >
                            {{ source.name }}
                        </span>
                        <span 
                            v-if="!source.isActive" 
                            class="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded"
                        >
                            inactive
                        </span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ source.accessCount }} hits · {{ source.documentCount }} docs
                    </span>
                </div>
                <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        class="h-full rounded-full transition-all duration-500 ease-out"
                        :class="source.isActive ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gray-400'"
                        :style="{ width: `${getBarWidth(source.accessCount)}%` }"
                    ></div>
                </div>
            </div>
        </div>

        <!-- Summary -->
        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">
                {{ store.activeSourcesCount }} active · {{ store.inactiveSourcesCount }} inactive
            </span>
        </div>
    </div>
</template>
