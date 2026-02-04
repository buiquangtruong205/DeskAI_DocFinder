<script setup lang="ts">
import { computed } from 'vue';
import type { SearchResultItem } from '../../services/search.service';

const props = defineProps<{
    item?: SearchResultItem | null;
    loading?: boolean;
    previewContent?: string;
}>();

const emit = defineEmits<{
    (e: 'open'): void;
    (e: 'copy'): void;
    (e: 'ask'): void;
}>();

const fileSize = computed(() => props.item?.size || 'Unknown size');
const lastModified = computed(() => {
    if (!props.item?.lastModified) return 'Unknown date';
    return new Date(props.item.lastModified).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-inner">
        <div v-if="!item" class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
            <span class="text-6xl mb-4 opacity-30 grayscale">📄</span>
            <p class="text-lg font-medium text-gray-500">Select a file to preview</p>
            <p class="text-sm">View details, content, and metadata here.</p>
        </div>

        <div v-else class="flex flex-col h-full animate-fadeIn">
            <!-- Header -->
            <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <div class="flex items-start gap-4">
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-3xl shadow-sm">
                        {{ item.type === 'python' ? '🐍' : '📄' }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h2 class="font-bold text-xl text-gray-800 dark:text-gray-100 leading-tight truncate" :title="item.name">{{ item.name }}</h2>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all font-mono opacity-80">{{ item.path }}</div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4 mt-6 text-sm">
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ item.type }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Size</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ fileSize }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Modified</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ lastModified }}</span>
                    </div>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
                <button @click="emit('open')" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/30 transition-all flex justify-center items-center gap-2">
                    <span>📂</span> Open Full
                </button>
                <button @click="emit('copy')" class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-200 shadow-sm">
                    📋
                </button>
                <button @click="emit('ask')" class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-200 shadow-sm">
                    💬
                </button>
            </div>

            <!-- Content Preview -->
            <div class="flex-1 overflow-y-auto p-0 relative bg-gray-50 dark:bg-[#0d1117]">
                <div v-if="loading" class="flex items-center justify-center h-full text-gray-500 gap-2">
                    <span class="animate-spin text-xl">⌛</span> <span class="font-medium">Loading preview...</span>
                </div>
                <!-- Mock Code Block Look -->
                <div v-else class="text-sm font-mono leading-relaxed overflow-x-auto">
                    <!-- Line Numbers (Mock) -->
                    <div class="flex">
                         <div class="flex-shrink-0 flex flex-col items-end px-2 py-4 bg-gray-100 dark:bg-gray-800/30 border-r border-gray-200 dark:border-gray-800 text-gray-400 select-none">
                            <span v-for="i in 20" :key="i" class="leading-relaxed">{{ i }}</span>
                        </div>
                        <pre class="p-4 text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{{ previewContent || item.content }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 4px;
}
</style>
