<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';

const store = usePlaygroundStore();
</script>

<template>
    <div class="flex flex-col gap-4 h-full">
        <!-- System Prompt -->
        <div class="flex-1 flex flex-col min-h-[150px]">
            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center justify-between">
                <span>System Prompt</span>
                <span class="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">Instructions</span>
            </label>
            <textarea 
                v-model="store.prompt.system"
                class="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
                placeholder="You are a helpful assistant..."
            ></textarea>
        </div>

        <!-- User Prompt -->
        <div class="flex-1 flex flex-col min-h-[150px]">
             <label class="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase mb-2 flex items-center justify-between">
                <span>User Prompt</span>
                <span class="text-[10px] bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">Input</span>
            </label>
            <textarea 
                v-model="store.prompt.user"
                class="flex-1 w-full p-4 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none font-medium text-base leading-relaxed text-gray-800 dark:text-gray-100 placeholder-gray-400"
                placeholder="Enter your question here..."
            ></textarea>
        </div>
    </div>
</template>
