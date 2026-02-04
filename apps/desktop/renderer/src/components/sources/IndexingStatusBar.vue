<script setup lang="ts">
import { computed } from 'vue';
import { useSourcesStore } from '../../stores/sources.store';

const store = useSourcesStore();

const statusText = computed(() => {
    const indexing = store.indexingSources;
    if (store.isGlobalPaused) {
        return 'Indexing paused';
    }
    if (indexing.length === 0) {
        return 'All sources indexed';
    }
    if (indexing.length === 1) {
        return `Indexing ${indexing[0].name}...`;
    }
    return `Indexing ${indexing.length} sources...`;
});

const queueInfo = computed(() => {
    const indexing = store.indexingSources;
    if (indexing.length === 0) return '';
    
    const totalRemaining = indexing.reduce((sum, s) => sum + (s.totalFiles - s.indexedFiles), 0);
    return `${totalRemaining} files remaining`;
});

const handlePauseResume = () => {
    if (store.isGlobalPaused) {
        store.resumeGlobal();
    } else {
        store.pauseGlobal();
    }
};
</script>

<template>
    <div class="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
            <!-- Left: Status -->
            <div class="flex items-center gap-4">
                <!-- Status Indicator -->
                <div class="flex items-center gap-2">
                    <span 
                        class="text-sm"
                        :class="{
                            'text-amber-500': store.indexingSources.length > 0 && !store.isGlobalPaused,
                            'text-gray-400': store.isGlobalPaused,
                            'text-green-500': store.indexingSources.length === 0
                        }"
                    >
                        <span v-if="store.indexingSources.length > 0 && !store.isGlobalPaused" class="animate-pulse">●</span>
                        <span v-else-if="store.isGlobalPaused">⏸</span>
                        <span v-else>✓</span>
                    </span>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ statusText }}
                    </span>
                </div>

                <!-- Queue Info -->
                <span v-if="queueInfo" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ queueInfo }}
                </span>

                <!-- Progress (when indexing) -->
                <div 
                    v-if="store.indexingSources.length > 0" 
                    class="flex items-center gap-2"
                >
                    <div class="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            class="h-full bg-blue-500 rounded-full transition-all duration-500"
                            :style="{ width: `${store.totalIndexingProgress}%` }"
                        ></div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ store.totalIndexingProgress }}%
                    </span>
                </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
                <!-- Pause/Resume -->
                <button 
                    v-if="store.indexingSources.length > 0 || store.isGlobalPaused"
                    @click="handlePauseResume"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    :class="store.isGlobalPaused 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                >
                    <span>{{ store.isGlobalPaused ? '▶' : '⏸' }}</span>
                    {{ store.isGlobalPaused ? 'Resume' : 'Pause' }}
                </button>

                <!-- Error Indicator -->
                <div 
                    v-if="store.hasErrors"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium"
                >
                    <span>⚠️</span>
                    Errors detected
                </div>
            </div>
        </div>
    </div>
</template>
