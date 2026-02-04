<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';
import { computed } from 'vue';

const store = usePlaygroundStore();

const hasResult = computed(() => !!store.result?.answer);
const isTyping = computed(() => store.loading);

const handleCopy = () => {
    if (store.result?.answer) {
        navigator.clipboard.writeText(store.result.answer);
    }
};
</script>

<template>
    <div class="h-full flex flex-col relative">
        <!-- Label -->
        <div class="flex items-center justify-between mb-2 shrink-0">
             <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Answer</label>
             <button 
                v-if="hasResult"
                @click="handleCopy"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
                <span>📋</span> Copy
            </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 overflow-y-auto shadow-sm relative">
            
            <!-- Empty State -->
            <div 
                v-if="!hasResult && !isTyping && !store.error" 
                class="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500"
            >
                <div class="text-4xl mb-4 opacity-50">✨</div>
                <p>Enter a prompt and click Run.</p>
            </div>

            <!-- Loading State -->
            <div v-if="isTyping" class="space-y-3 animate-pulse">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>

            <!-- Error State -->
            <div v-if="store.error" class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <strong>Error:</strong> {{ store.error }}
            </div>

            <!-- Answer -->
            <div v-if="hasResult && !isTyping" class="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {{ store.result?.answer }}
            </div>
        </div>
    </div>
</template>
