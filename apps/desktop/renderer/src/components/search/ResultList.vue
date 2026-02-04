<script setup lang="ts">
import ResultItem from './ResultItem.vue';
import type { SearchResultItem } from '../../services/search.service';

defineProps<{
    results: SearchResultItem[];
    selectedId?: string;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: 'select', item: SearchResultItem): void;
    (e: 'open', item: SearchResultItem): void;
    (e: 'favorite', item: SearchResultItem): void;
    (e: 'ask', item: SearchResultItem): void;
}>();
</script>

<template>
    <div class="h-full overflow-y-auto custom-scrollbar">
        <div v-if="loading" class="flex flex-col items-center justify-center h-40 text-gray-500">
            <span class="text-2xl animate-spin mb-2">⌛</span>
            <span>Searching...</span>
        </div>

        <div v-else-if="results.length === 0" class="flex flex-col items-center justify-center h-40 text-gray-500 p-4 text-center">
            <span class="text-2xl mb-2">🔍</span>
            <p>Không tìm thấy kết quả.</p>
            <p class="text-sm mt-1">Thử tìm kiếm theo nội dung hoặc hỏi AI.</p>
            <!-- Debug Info -->
            <p class="text-xs text-gray-300 mt-4">Debug: Loading={{ loading }}, Results=0</p>
        </div>

        <div v-else>
            <ResultItem 
                v-for="item in results" 
                :key="item.id" 
                :item="item"
                :selected="item.id === selectedId"
                @select="emit('select', item)"
                @open="emit('open', item)"
                @favorite="emit('favorite', item)"
                @ask="emit('ask', item)"
            />
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
}
</style>
