<script setup lang="ts">
import { useSourcesStore } from '../../stores/sources.store';
import type { Source } from '../../services/sources.service';

const props = defineProps<{
    source: Source;
}>();

const store = useSourcesStore();

const handleReindex = () => {
    store.reindexSource(props.source.id);
};

const handleClearIndex = () => {
    if (confirm('Clear index data for this source? Files will remain but need to be re-indexed.')) {
        store.clearIndex(props.source.id);
    }
};

const handleRemove = () => {
    if (confirm('Remove this source and delete all its index data?')) {
        store.removeSource(props.source.id);
    }
};
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <span>⚙️</span>
            Index Controls
        </h3>

        <div class="space-y-3">
            <!-- Re-index Source -->
            <button 
                @click="handleReindex"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 transition-colors group"
            >
                <span class="text-xl">🔄</span>
                <div class="text-left flex-1">
                    <div class="font-medium">Re-index Source</div>
                    <div class="text-xs opacity-70">Scan and re-embed all files</div>
                </div>
            </button>

            <!-- Clear Index -->
            <button 
                @click="handleClearIndex"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-colors"
            >
                <span class="text-xl">🗑️</span>
                <div class="text-left flex-1">
                    <div class="font-medium">Clear Index</div>
                    <div class="text-xs opacity-70">Delete index, keep source</div>
                </div>
            </button>

            <!-- Remove Source -->
            <button 
                @click="handleRemove"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 transition-colors"
            >
                <span class="text-xl">❌</span>
                <div class="text-left flex-1">
                    <div class="font-medium">Remove Source</div>
                    <div class="text-xs opacity-70">Remove source and delete index</div>
                </div>
            </button>
        </div>
    </div>
</template>
