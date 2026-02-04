<script setup lang="ts">
import { computed } from 'vue';
import { useInsightsStore } from '../../stores/insights.store';

const store = useInsightsStore();

const totalCount = computed(() => 
    store.topicStats.reduce((sum, t) => sum + t.count, 0)
);

const topTopics = computed(() => store.topicStats.slice(0, 7));

// Colors for the donut segments
const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500'
];

// Calculate donut segment positions
const segments = computed(() => {
    let offset = 0;
    return topTopics.value.map((topic, index) => {
        const segment = {
            ...topic,
            offset,
            color: colors[index % colors.length],
            dashArray: `${topic.percentage} ${100 - topic.percentage}`
        };
        offset += topic.percentage;
        return segment;
    });
});
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏷️</span>
            Topic Distribution
        </h3>

        <!-- Loading state -->
        <div v-if="store.loading && !store.topicStats.length" class="h-48 flex items-center justify-center">
            <div class="animate-pulse text-gray-400">Loading...</div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!store.topicStats.length" class="h-48 flex items-center justify-center text-gray-400 text-sm">
            No topic data available
        </div>

        <!-- Chart with legend -->
        <div v-else class="flex items-start gap-4">
            <!-- Simple bar chart representation -->
            <div class="flex-1 space-y-2">
                <div 
                    v-for="(topic, index) in topTopics" 
                    :key="topic.tag"
                    class="flex items-center gap-2"
                >
                    <div 
                        class="w-3 h-3 rounded-full flex-shrink-0"
                        :class="colors[index % colors.length]"
                    ></div>
                    <span class="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate capitalize">
                        {{ topic.tag }}
                    </span>
                    <div class="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            class="h-full rounded-full transition-all duration-500"
                            :class="colors[index % colors.length]"
                            :style="{ width: `${topic.percentage}%` }"
                        ></div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                        {{ topic.percentage }}%
                    </span>
                </div>
            </div>
        </div>

        <!-- Total -->
        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Total tagged items</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ totalCount }}</span>
        </div>
    </div>
</template>
