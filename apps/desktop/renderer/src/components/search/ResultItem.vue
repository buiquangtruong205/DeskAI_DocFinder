<script setup lang="ts">
import { computed } from 'vue';
import type { SearchResultItem } from '../../services/search.service';

const props = defineProps<{
    item: SearchResultItem;
    selected: boolean;
}>();

defineEmits<{
    (e: 'select', item: SearchResultItem): void;
    (e: 'open', item: SearchResultItem): void;
    (e: 'favorite', item: SearchResultItem): void;
    (e: 'ask', item: SearchResultItem): void;
}>();

const icon = computed(() => {
    const map: Record<string, string> = {
        'markdown': '📄',
        'python': '🐍',
        'pdf': '📕',
        'code': '💻',
        'folder': '📁'
    };
    return map[props.item.type] || '📄';
});

const scorePercent = computed(() => {
    return Math.round((props.item.score || 0) * 100);
});

const scoreColor = computed(() => {
    const s = props.item.score || 0;
    if (s > 0.9) return 'text-green-500';
    if (s > 0.7) return 'text-blue-500';
    return 'text-gray-400';
});
</script>

<template>
    <div 
        @click="$emit('select', item)"
        class="group relative p-4 mb-2 mx-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer"
        :class="[
            selected 
                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
        ]"
    >
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 overflow-hidden">
                <div class="mt-1 flex-shrink-0 text-2xl opacity-80 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    {{ icon }}
                </div>
                <div class="min-w-0">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100 leading-snug truncate text-base" :class="{ 'text-blue-600 dark:text-blue-400': selected }">
                        {{ item.name }}
                    </h3>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate font-mono opacity-70">
                        {{ item.path }}
                    </div>
                    
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {{ item.content }}
                    </p>

                    <div class="flex items-center gap-2 mt-3">
                        <span v-for="tag in item.tags" :key="tag" class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700">
                            #{{ tag }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-end gap-2 flex-shrink-0">
                <div class="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" :class="scoreColor">
                    {{ scorePercent }}% Match
                </div>
                
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-95 group-hover:scale-100">
                     <button @click.stop="$emit('open', item)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-gray-200 transition-all" title="Open folder">📂</button>
                    <button @click.stop="$emit('ask', item)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-purple-600 shadow-sm border border-transparent hover:border-gray-200 transition-all" title="Ask AI">💬</button>
                    <button @click.stop="$emit('favorite', item)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-yellow-500 shadow-sm border border-transparent hover:border-gray-200 transition-all" title="Favorite">⭐</button>
                </div>
            </div>
        </div>
    </div>
</template>
