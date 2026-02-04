<script setup lang="ts">
import { computed } from 'vue';
import type { Source } from '../../services/sources.service';

const props = defineProps<{
    source: Source;
}>();

const progress = computed(() => {
    if (props.source.totalFiles === 0) return 0;
    return Math.round((props.source.indexedFiles / props.source.totalFiles) * 100);
});

const statusText = computed(() => {
    switch (props.source.status) {
        case 'indexing':
            if (progress.value < 30) return 'Scanning files...';
            if (progress.value < 70) return 'Embedding chunks...';
            return 'Finalizing...';
        case 'paused':
            return 'Indexing paused';
        case 'error':
            return 'Errors occurred during indexing';
        case 'indexed':
            return 'All files indexed successfully';
        default:
            return 'Idle';
    }
});

const statusColor = computed(() => {
    switch (props.source.status) {
        case 'indexing': return 'from-blue-500 to-purple-500';
        case 'paused': return 'from-amber-500 to-orange-500';
        case 'error': return 'from-red-500 to-pink-500';
        case 'indexed': return 'from-green-500 to-emerald-500';
        default: return 'from-gray-400 to-gray-500';
    }
});
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📊</span>
                Indexing Progress
            </h3>
            <span class="text-sm font-medium" :class="{
                'text-blue-500': source.status === 'indexing',
                'text-amber-500': source.status === 'paused',
                'text-red-500': source.status === 'error',
                'text-green-500': source.status === 'indexed'
            }">
                {{ progress }}%
            </span>
        </div>

        <!-- Progress Bar -->
        <div class="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            <div 
                class="absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500"
                :class="statusColor"
                :style="{ width: `${progress}%` }"
            >
                <!-- Animated shimmer for indexing state -->
                <div 
                    v-if="source.status === 'indexing'"
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
                ></div>
            </div>
        </div>

        <!-- Progress Details -->
        <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">
                {{ statusText }}
            </span>
            <span class="text-gray-600 dark:text-gray-300 font-medium">
                {{ source.indexedFiles }} / {{ source.totalFiles }} files
            </span>
        </div>

        <!-- Current File (when indexing) -->
        <div v-if="source.status === 'indexing'" class="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <span class="animate-spin">⌛</span>
                <span class="truncate">Processing...</span>
            </div>
        </div>
    </div>
</template>
