<script setup lang="ts">
import { computed } from 'vue';
import type { Citation } from '../../services/ask.service';
import { invoke } from '../../services/desktopApi';

const props = defineProps<{
    citation: Citation;
}>();

const icon = computed(() => {
    const map: Record<string, string> = {
        'markdown': '📄',
        'md': '📄',
        'doc': '📄',
        'pdf': '📕',
        'python': '🐍',
        'py': '🐍',
        'code': '💻',
        'js': '💻',
        'ts': '💻',
        'vue': '💚',
        'json': '📋'
    };
    return map[props.citation.type] || '📄';
});

// Extract filename from path for display
const displayPath = computed(() => {
    const path = props.citation.path;
    if (!path) return '';
    // Shorten long paths
    if (path.length > 50) {
        const parts = path.split(/[/\\]/);
        if (parts.length > 3) {
            return `.../${parts.slice(-3).join('/')}`;
        }
    }
    return path;
});

// Open file in explorer
async function openInExplorer() {
    try {
        if (props.citation.path) {
            await invoke('file:showInFolder', props.citation.path);
        }
    } catch (err) {
        console.error('Failed to open file:', err);
    }
}

// Open file directly
async function openFile() {
    try {
        if (props.citation.path) {
            await invoke('file:open', props.citation.path);
        }
    } catch (err) {
        console.error('Failed to open file:', err);
    }
}
</script>

<template>
    <div class="group relative flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
         @click="openFile">
        <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xl shadow-sm">
            {{ icon }}
        </div>
        <div class="min-w-0 flex-1">
            <h4 class="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ citation.name }}
            </h4>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate opacity-80" :title="citation.path">
                {{ displayPath }}
            </div>
            <p class="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-100 dark:border-gray-800 italic">
                "{{ citation.snippet }}"
            </p>
        </div>
        
        <!-- Score Badge -->
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                {{ Math.round(citation.score * 100) }}%
            </span>
        </div>

        <!-- Action Buttons -->
        <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button 
                @click.stop="openInExplorer"
                class="p-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-500 text-xs"
                title="Mở trong Explorer"
            >
                📂
            </button>
            <button 
                @click.stop="openFile"
                class="p-1.5 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded text-green-500 text-xs"
                title="Mở file"
            >
                📄
            </button>
        </div>
    </div>
</template>

