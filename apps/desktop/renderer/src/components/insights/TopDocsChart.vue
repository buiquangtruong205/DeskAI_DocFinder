<script setup lang="ts">
import { computed } from 'vue';
import { useInsightsStore } from '../../stores/insights.store';
import { formatRelativeTime } from '../../services/insights.service';

const store = useInsightsStore();

const maxAccessCount = computed(() => {
    if (!store.topDocuments.length) return 100;
    return Math.max(...store.topDocuments.map(d => d.accessCount));
});

const getBarWidth = (count: number) => {
    return (count / maxAccessCount.value) * 100;
};

const topDocs = computed(() => store.topDocuments.slice(0, 7));
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📄</span>
            Most Used Documents
        </h3>

        <!-- Loading state -->
        <div v-if="store.loading && !store.topDocuments.length" class="space-y-3">
            <div v-for="i in 5" :key="i" class="animate-pulse">
                <div class="flex items-center gap-2 mb-1">
                    <div class="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" :style="{ width: `${80 - i * 10}%` }"></div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!store.topDocuments.length" class="h-40 flex items-center justify-center text-gray-400 text-sm">
            No document usage data yet
        </div>

        <!-- Document list -->
        <div v-else class="space-y-3">
            <div 
                v-for="doc in topDocs" 
                :key="doc.id"
                class="group cursor-pointer"
            >
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70%] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {{ doc.name }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ doc.accessCount }} hits
                    </span>
                </div>
                <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
                        :style="{ width: `${getBarWidth(doc.accessCount)}%` }"
                    ></div>
                </div>
            </div>
        </div>

        <!-- View all link -->
        <div v-if="store.topDocuments.length > 5" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all documents →
            </button>
        </div>
    </div>
</template>
