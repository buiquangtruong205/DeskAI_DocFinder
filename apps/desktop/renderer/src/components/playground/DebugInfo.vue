<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';
import { computed } from 'vue';

const store = usePlaygroundStore();
const debug = computed(() => store.result?.debug);
</script>

<template>
    <div v-if="debug" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-xs font-mono">
        <div class="grid grid-cols-2 gap-4 mb-3">
             <!-- Timings -->
            <div>
                <h4 class="font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Timing</h4>
                <div class="space-y-1 text-gray-700 dark:text-gray-300">
                    <div class="flex justify-between">
                        <span>Retrieval:</span>
                        <span>{{ debug.retrievalTimeMs }}ms</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Generation:</span>
                        <span>{{ debug.generationTimeMs }}ms</span>
                    </div>
                    <div class="flex justify-between font-bold pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span>Total:</span>
                        <span>{{ debug.retrievalTimeMs + debug.generationTimeMs }}ms</span>
                    </div>
                </div>
            </div>

            <!-- Tokens -->
            <div>
                 <h4 class="font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tokens</h4>
                 <div class="space-y-1 text-gray-700 dark:text-gray-300">
                    <div class="flex justify-between">
                        <span>Prompt:</span>
                        <span>{{ debug.tokenUsage.prompt }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Completion:</span>
                        <span>{{ debug.tokenUsage.completion }}</span>
                    </div>
                     <div class="flex justify-between font-bold pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span>Total:</span>
                        <span>{{ debug.tokenUsage.total }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Model -->
        <div class="mb-3">
             <div class="flex gap-2">
                <span class="font-bold text-gray-500 dark:text-gray-400 uppercase">Model:</span>
                <span class="text-gray-800 dark:text-gray-200">{{ debug.modelName }}</span>
             </div>
        </div>

        <!-- Final Prompt -->
        <details class="group">
            <summary class="cursor-pointer font-bold text-gray-500 dark:text-gray-400 uppercase list-none flex items-center gap-2 hover:text-blue-500">
                 <span class="transform transition-transform group-open:rotate-90">▶</span>
                 Show Final Prompt
            </summary>
            <div class="mt-2 p-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                {{ debug.finalPrompt }}
            </div>
        </details>
    </div>
</template>
