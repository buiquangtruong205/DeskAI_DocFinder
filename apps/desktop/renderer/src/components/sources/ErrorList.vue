<script setup lang="ts">
import { useSourcesStore } from '../../stores/sources.store';
import type { Source } from '../../services/sources.service';

const props = defineProps<{
    source: Source;
}>();

const store = useSourcesStore();

const handleRetryAll = () => {
    store.retryFailed(props.source.id);
};

const handleIgnore = (filePath: string) => {
    store.ignoreFile(props.source.id, filePath);
};
</script>

<template>
    <div v-if="source.errors.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-5">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <span>⚠️</span>
                Errors & Warnings
            </h3>
            <button 
                @click="handleRetryAll"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
            >
                Retry All
            </button>
        </div>

        <!-- Error List -->
        <div class="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            <div 
                v-for="error in source.errors" 
                :key="error.file"
                class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg group"
            >
                <span class="text-red-500 text-sm mt-0.5">❌</span>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" :title="error.file">
                        {{ error.file.split('/').pop() }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate" :title="error.file">
                        {{ error.file }}
                    </p>
                    <p class="text-xs text-red-500 dark:text-red-400 mt-1">
                        {{ error.message }}
                    </p>
                </div>
                <button 
                    @click="handleIgnore(error.file)"
                    class="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all"
                >
                    Ignore
                </button>
            </div>
        </div>

        <!-- Summary -->
        <div class="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30 text-sm text-gray-500 dark:text-gray-400">
            {{ source.errors.length }} file(s) failed to index
        </div>
    </div>
</template>
