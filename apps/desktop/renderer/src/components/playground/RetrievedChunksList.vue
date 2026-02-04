<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';
import { computed } from 'vue';

const store = usePlaygroundStore();
const chunks = computed(() => store.result?.retrievedChunks || []);

const getIcon = (filename: string) => {
    if (filename.endsWith('.md')) return '📄';
    if (filename.endsWith('.pdf')) return '📕';
    if (filename.endsWith('.py') || filename.endsWith('.ts')) return '💻';
    return '📄';
};
</script>

<template>
    <div v-if="chunks.length > 0" class="flex flex-col h-full">
         <div class="flex items-center justify-between mb-2 shrink-0">
             <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                <span>📚</span> Retrieved Context
                <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 rounded-full">{{ chunks.length }}</span>
             </label>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 pr-1">
            <div 
                v-for="chunk in chunks" 
                :key="chunk.id"
                class="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all cursor-pointer"
            >
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <span class="text-lg">{{ getIcon(chunk.fileName) }}</span>
                        <div class="min-w-0">
                            <div class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" :title="chunk.fileName">
                                {{ chunk.fileName }}
                            </div>
                            <div class="text-[10px] text-gray-500 dark:text-gray-400 truncate opacity-70">
                                {{ chunk.filePath }}
                            </div>
                        </div>
                    </div>
                     <span class="text-xs font-mono font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                        {{ (chunk.score * 100).toFixed(0) }}%
                    </span>
                </div>

                <div class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800 font-mono">
                    "{{ chunk.content }}"
                </div>
            </div>
        </div>
    </div>
</template>
