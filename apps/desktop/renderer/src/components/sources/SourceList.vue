<script setup lang="ts">
import { useSourcesStore } from '../../stores/sources.store';
import SourceItem from './SourceItem.vue';

const store = useSourcesStore();

const handleReindex = (sourceId: string) => {
    store.reindexSource(sourceId);
};

const handlePause = (sourceId: string) => {
    store.pauseSource(sourceId);
};

const handleResume = (sourceId: string) => {
    store.resumeSource(sourceId);
};

const handleRemove = (sourceId: string) => {
    if (confirm('Remove this source? This will also delete its index data.')) {
        store.removeSource(sourceId);
    }
};
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        <!-- List Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {{ store.sources.length }} Sources
                </span>
                <div v-if="store.indexingSources.length > 0" class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <span class="animate-pulse">●</span>
                    {{ store.indexingSources.length }} indexing
                </div>
            </div>
        </div>

        <!-- Source List -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">
            <!-- Empty State -->
            <div v-if="store.sources.length === 0 && !store.loading" class="flex flex-col items-center justify-center h-full p-8 text-center">
                <div class="text-5xl mb-4 opacity-50">📂</div>
                <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No sources added yet
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    Add your first folder to start indexing documents for search and AI
                </p>
                <button 
                    @click="store.openAddDialog()"
                    class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                    <span>+</span>
                    Add your first folder
                </button>
            </div>

            <!-- Loading State -->
            <div v-else-if="store.loading && store.sources.length === 0" class="flex items-center justify-center h-full">
                <div class="flex items-center gap-3 text-gray-500">
                    <span class="animate-spin text-xl">⌛</span>
                    Loading sources...
                </div>
            </div>

            <!-- Source Items -->
            <!-- Source Items -->
            <div v-else class="flex-1">
                <SourceItem 
                    v-for="source in store.sources" 
                    :key="source.id"
                    :source="source"
                    :selected="store.selectedSourceId === source.id"
                    @select="store.selectSource(source.id)"
                    @reindex="handleReindex(source.id)"
                    @pause="handlePause(source.id)"
                    @resume="handleResume(source.id)"
                    @remove="handleRemove(source.id)"
                />
            </div>
        </div>
    </div>
</template>
