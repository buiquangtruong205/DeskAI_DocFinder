<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';
import PresetManager from './PresetManager.vue';

const store = usePlaygroundStore();

const handleRun = () => {
    store.runQuery();
};

const handleReset = () => {
    if (confirm('Are you sure you want to reset all parameters?')) {
        store.resetState();
    }
};
</script>

<template>
    <div class="h-16 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 z-20">
        <!-- Title -->
        <div>
            <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>🧪</span> Playground
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Test prompts and retrieval parameters</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
             <PresetManager />

            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

             <button 
                @click="handleReset"
                class="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
            >
                Reset
            </button>

            <button 
                @click="handleRun"
                :disabled="store.loading"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span v-if="store.loading" class="animate-spin">⏳</span>
                <span v-else>▶ Run</span>
            </button>
        </div>
    </div>
</template>
