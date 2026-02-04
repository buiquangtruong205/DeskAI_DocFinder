<script setup lang="ts">
import type { Source } from '../../services/sources.service';

const props = defineProps<{
    source: Source;
}>();
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
                    📁
                </div>
                <div>
                    <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                        {{ source.name }}
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" :title="source.path">
                        {{ source.path }}
                    </p>
                </div>
            </div>
            
            <!-- Type Badge -->
            <span class="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {{ source.type === 'folder' ? '📂 Folder' : '📚 Collection' }}
            </span>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-4 mt-4">
            <!-- Total Files -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ source.totalFiles }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total Files
                </div>
            </div>

            <!-- Indexed Files -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ source.indexedFiles }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Indexed
                </div>
            </div>

            <!-- Failed Files -->
            <div class="rounded-lg p-3 text-center" :class="source.failedFiles > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'">
                <div class="text-2xl font-bold" :class="source.failedFiles > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'">
                    {{ source.failedFiles }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Failed
                </div>
            </div>
        </div>

        <!-- Last Update -->
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Last updated</span>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ source.lastUpdate }}</span>
        </div>
    </div>
</template>
