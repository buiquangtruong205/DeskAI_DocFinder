<script setup lang="ts">
import { useSourcesStore } from '../../stores/sources.store';

const store = useSourcesStore();

const handlePauseResume = () => {
    if (store.isGlobalPaused) {
        store.resumeGlobal();
    } else {
        store.pauseGlobal();
    }
};

const handleReindexAll = () => {
    if (confirm('Re-index all sources? This may take some time.')) {
        store.reindexAll();
    }
};
</script>

<template>
    <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <!-- Left: Title & Subtitle -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="text-2xl">📁</span>
                Sources
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage folders and data sources used for search and AI
            </p>
        </div>

        <!-- Right: Action Buttons -->
        <div class="flex items-center gap-3">
            <!-- Add Source Button -->
            <button 
                @click="store.openAddDialog()"
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
                <span class="text-lg">+</span>
                Add Source
            </button>

            <!-- Re-index All Button -->
            <button 
                @click="handleReindexAll"
                class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                title="Re-index all sources"
            >
                <span class="text-base">🔄</span>
                Re-index All
            </button>

            <!-- Pause/Resume Button -->
            <button 
                @click="handlePauseResume"
                class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                :class="store.isGlobalPaused 
                    ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400' 
                    : 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400'"
                :title="store.isGlobalPaused ? 'Resume indexing' : 'Pause indexing'"
            >
                <span class="text-base">{{ store.isGlobalPaused ? '▶' : '⏸' }}</span>
                {{ store.isGlobalPaused ? 'Resume' : 'Pause' }} Indexing
            </button>
        </div>
    </div>
</template>
