<script setup lang="ts">
import { computed } from 'vue';
import type { Citation } from '../../services/ask.service';

const props = defineProps<{
    citation: Citation;
}>();

const icon = computed(() => {
    const map: Record<string, string> = {
        'markdown': '📄',
        'pdf': '📕',
        'python': '🐍',
        'code': '💻'
    };
    return map[props.citation.type] || '📄';
});
</script>

<template>
    <div class="group relative flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer">
        <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xl shadow-sm">
            {{ icon }}
        </div>
        <div class="min-w-0 flex-1">
            <h4 class="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ citation.name }}
            </h4>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate opacity-80">
                {{ citation.path }}
            </div>
            <p class="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-800 italic">
                "{{ citation.snippet }}"
            </p>
        </div>
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                {{ Math.round(citation.score * 100) }}%
            </span>
        </div>
    </div>
</template>
