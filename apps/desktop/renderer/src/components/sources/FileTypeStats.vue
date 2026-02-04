<script setup lang="ts">
import { computed } from 'vue';
import type { Source } from '../../services/sources.service';

const props = defineProps<{
    source: Source;
}>();

const fileTypeColors: Record<string, string> = {
    '.md': 'bg-blue-500',
    '.pdf': 'bg-red-500',
    '.txt': 'bg-gray-500',
    '.py': 'bg-green-500',
    '.js': 'bg-yellow-500',
    '.ts': 'bg-blue-400',
    '.json': 'bg-orange-500',
    '.csv': 'bg-emerald-500',
    '.xml': 'bg-purple-500',
    '.docx': 'bg-blue-600',
    '.html': 'bg-orange-400',
    '.css': 'bg-pink-500',
};

const fileTypeIcons: Record<string, string> = {
    '.md': '📝',
    '.pdf': '📕',
    '.txt': '📄',
    '.py': '🐍',
    '.js': '⚡',
    '.ts': '💎',
    '.json': '🔧',
    '.csv': '📊',
    '.xml': '📋',
    '.docx': '📘',
    '.html': '🌐',
    '.css': '🎨',
};

const sortedTypes = computed(() => {
    return Object.entries(props.source.fileTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // Show max 6 types
});

const totalFiles = computed(() => 
    Object.values(props.source.fileTypes).reduce((a, b) => a + b, 0)
);
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <span>📂</span>
            File Types
        </h3>

        <!-- Empty State -->
        <div v-if="sortedTypes.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No files indexed yet
        </div>

        <!-- File Type List -->
        <div v-else class="space-y-3">
            <div 
                v-for="[ext, count] in sortedTypes" 
                :key="ext"
                class="flex items-center gap-3"
            >
                <!-- Icon -->
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg" 
                    :class="fileTypeColors[ext] || 'bg-gray-400'"
                    style="opacity: 0.9;">
                    {{ fileTypeIcons[ext] || '📄' }}
                </div>

                <!-- Type & Count -->
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ ext }}
                        </span>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ count }}
                        </span>
                    </div>
                    <!-- Mini Progress Bar -->
                    <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            class="h-full rounded-full transition-all duration-300"
                            :class="fileTypeColors[ext] || 'bg-gray-400'"
                            :style="{ width: `${(count / totalFiles) * 100}%` }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total -->
        <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Total files</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ totalFiles }}</span>
        </div>
    </div>
</template>
