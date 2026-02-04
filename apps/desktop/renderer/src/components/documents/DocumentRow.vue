<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Document } from '../../services/documents.service';
import { formatRelativeTime } from '../../services/documents.service';

const props = defineProps<{
    document: Document;
    selected: boolean;
    checked: boolean;
}>();

const emit = defineEmits<{
    (e: 'select', doc: Document): void;
    (e: 'check', doc: Document): void;
    (e: 'open', doc: Document): void;
    (e: 'favorite', doc: Document): void;
    (e: 'reindex', doc: Document): void;
    (e: 'remove', doc: Document): void;
    (e: 'reveal', doc: Document): void;
}>();

const showMoreMenu = ref(false);

const icon = computed(() => {
    const map: Record<string, string> = {
        'markdown': '📄',
        'pdf': '📕',
        'python': '🐍',
        'code': '💻',
        'text': '📝',
        'json': '📋'
    };
    return map[props.document.type] || '📄';
});

const statusIcon = computed(() => {
    switch (props.document.status) {
        case 'indexed': return '✅';
        case 'error': return '❌';
        case 'pending': return '⏳';
        default: return '❓';
    }
});

const statusClass = computed(() => {
    switch (props.document.status) {
        case 'indexed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
        case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
        case 'pending': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
        default: return 'text-gray-600 bg-gray-100';
    }
});

const relativeIndexedTime = computed(() => formatRelativeTime(props.document.lastIndexed));
</script>

<template>
    <div
        @click="emit('select', document)"
        class="group flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        :class="{ 'bg-blue-50 dark:bg-blue-900/10': selected }"
    >
        <!-- Checkbox -->
        <div class="flex-shrink-0">
            <input
                type="checkbox"
                :checked="checked"
                @click.stop
                @change="emit('check', document)"
                class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
        </div>

        <!-- Icon -->
        <div class="flex-shrink-0 text-2xl p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {{ icon }}
        </div>

        <!-- File Info -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
                <h3
                    class="font-medium text-gray-900 dark:text-gray-100 truncate"
                    :class="{ 'text-blue-600 dark:text-blue-400': selected }"
                >
                    {{ document.name }}
                </h3>
                <span
                    v-if="document.isFavorite"
                    class="text-yellow-500"
                    title="Favorite"
                >
                    ⭐
                </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {{ document.source }}
            </div>
            <!-- Tags -->
            <div v-if="document.tags.length > 0" class="flex items-center gap-1 mt-1.5 flex-wrap">
                <span
                    v-for="tag in document.tags.slice(0, 3)"
                    :key="tag"
                    class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                >
                    #{{ tag }}
                </span>
                <span
                    v-if="document.tags.length > 3"
                    class="text-xs text-gray-400"
                >
                    +{{ document.tags.length - 3 }}
                </span>
            </div>
        </div>

        <!-- Type Badge -->
        <div class="flex-shrink-0 hidden md:block">
            <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium uppercase">
                {{ document.type }}
            </span>
        </div>

        <!-- Size -->
        <div class="flex-shrink-0 hidden lg:block w-20 text-right">
            <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ document.size }}
            </span>
        </div>

        <!-- Last Indexed -->
        <div class="flex-shrink-0 hidden lg:block w-24 text-right">
            <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ relativeIndexedTime }}
            </span>
        </div>

        <!-- Status -->
        <div class="flex-shrink-0 w-20 text-center">
            <span
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                :class="statusClass"
                :title="document.errorMessage"
            >
                {{ statusIcon }}
                <span class="hidden sm:inline">{{ document.status }}</span>
            </span>
        </div>

        <!-- Actions -->
        <div class="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <!-- Preview Button -->
            <button
                @click.stop="emit('select', document)"
                class="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                title="Preview"
            >
                👁
            </button>

            <!-- Open Button -->
            <button
                @click.stop="emit('open', document)"
                class="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                title="Open folder"
            >
                ↗
            </button>

            <!-- Favorite Button -->
            <button
                @click.stop="emit('favorite', document)"
                class="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                :class="document.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'"
                title="Toggle favorite"
            >
                {{ document.isFavorite ? '⭐' : '☆' }}
            </button>

            <!-- More Menu -->
            <div class="relative">
                <button
                    @click.stop="showMoreMenu = !showMoreMenu"
                    class="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    title="More actions"
                >
                    ⋯
                </button>

                <!-- Dropdown -->
                <div
                    v-if="showMoreMenu"
                    class="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                    <button
                        @click.stop="emit('reindex', document); showMoreMenu = false"
                        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <span>🔄</span>
                        Re-index file
                    </button>
                    <button
                        @click.stop="emit('reveal', document); showMoreMenu = false"
                        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <span>📂</span>
                        Reveal in Explorer
                    </button>
                    <div class="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                    <button
                        @click.stop="emit('remove', document); showMoreMenu = false"
                        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <span>🗑️</span>
                        Remove from index
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Click outside to close menu -->
    <div
        v-if="showMoreMenu"
        class="fixed inset-0 z-40"
        @click="showMoreMenu = false"
    ></div>
</template>
