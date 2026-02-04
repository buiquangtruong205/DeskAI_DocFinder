<script setup lang="ts">
import { computed } from 'vue';
import type { Source } from '../../services/sources.service';

const props = defineProps<{
    source: Source;
    selected: boolean;
}>();

const emit = defineEmits<{
    select: [];
    reindex: [];
    pause: [];
    resume: [];
    remove: [];
}>();

const statusConfig: Record<string, any> = {
    indexed: { icon: '🟢', label: 'Indexed', class: 'text-green-600 dark:text-green-400' },
    indexing: { icon: '🟡', label: 'Indexing...', class: 'text-amber-600 dark:text-amber-400' },
    error: { icon: '🔴', label: 'Error', class: 'text-red-600 dark:text-red-400' },
    paused: { icon: '⏸', label: 'Paused', class: 'text-gray-500 dark:text-gray-400' },
    pending: { icon: '⏳', label: 'Pending', class: 'text-gray-400 dark:text-gray-500' }
};

const status = computed(() => statusConfig[props.source.status] || statusConfig.pending);

</script>

<template>
    <div 
        @click="emit('select')"
        class="group p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all duration-200"
        :class="selected 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-l-transparent'"
    >
        <div class="flex items-start justify-between">
            <!-- Source Info -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg">📁</span>
                    <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                        {{ source.name }}
                    </h3>
                </div>
                
                <!-- Status Row -->
                <div class="flex items-center gap-3 text-sm">
                    <span :class="status.class" class="flex items-center gap-1">
                        <span class="text-xs">{{ status.icon }}</span>
                        {{ status.label }}
                    </span>
                    <span class="text-gray-400 dark:text-gray-500">•</span>
                    <span class="text-gray-500 dark:text-gray-400">
                        {{ source.indexedFiles }}/{{ source.totalFiles }} files
                    </span>
                    <span class="text-gray-400 dark:text-gray-500">•</span>
                    <span class="text-gray-400 dark:text-gray-500 text-xs">
                        {{ source.lastUpdate }}
                    </span>
                </div>

                <!-- Progress Bar for Indexing -->
                <div v-if="source.status === 'indexing'" class="mt-2">
                    <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                            :style="{ width: `${(source.indexedFiles / source.totalFiles) * 100}%` }"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions (visible on hover) -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <!-- Re-index -->
                <button 
                    @click.stop="emit('reindex')"
                    class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 transition-colors"
                    title="Re-index"
                >
                    🔄
                </button>
                
                <!-- Pause/Resume -->
                <button 
                    v-if="source.status === 'indexing'"
                    @click.stop="emit('pause')"
                    class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-amber-500 transition-colors"
                    title="Pause"
                >
                    ⏸
                </button>
                <button 
                    v-else-if="source.status === 'paused'"
                    @click.stop="emit('resume')"
                    class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-green-500 transition-colors"
                    title="Resume"
                >
                    ▶
                </button>
                
                <!-- Remove -->
                <button 
                    @click.stop="emit('remove')"
                    class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
                    title="Remove"
                >
                    ❌
                </button>
            </div>
        </div>
    </div>
</template>
