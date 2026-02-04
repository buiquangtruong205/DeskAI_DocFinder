<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';
import { useSourcesStore } from '../../stores/sources.store';
import { computed, onMounted } from 'vue';

const store = usePlaygroundStore();
const sourcesStore = useSourcesStore();

onMounted(() => {
    if (sourcesStore.sources.length === 0) {
        sourcesStore.fetchSources();
    }
});

const availableCollections = computed(() => sourcesStore.sources.map(s => ({
    id: s.id,
    name: s.name,
    count: s.indexedFiles
})));

const toggleCollection = (id: string) => {
    const list = store.context.collections;
    const idx = list.indexOf(id);
    if (idx === -1) {
        list.push(id);
    } else {
        list.splice(idx, 1);
    }
};
</script>

<template>
    <div class="space-y-6">
        <!-- Collections -->
        <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Target Collections</label>
            <div class="grid grid-cols-2 gap-2">
                <button
                    v-for="col in availableCollections"
                    :key="col.id"
                    @click="toggleCollection(col.id)"
                    class="px-3 py-2 text-sm rounded-lg border text-left flex items-center justify-between transition-all"
                    :class="store.context.collections.includes(col.id) 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'"
                >
                    <span class="truncate font-medium">{{ col.name }}</span>
                    <span class="text-xs opacity-60 ml-2 bg-black/5 dark:bg-white/10 px-1.5 rounded">{{ col.count }}</span>
                </button>
            </div>
            <p v-if="availableCollections.length === 0" class="text-xs text-gray-400 italic mt-2">
                No collections found. Add sources in the Sources tab.
            </p>
        </div>

        <!-- Strategy Toggles -->
        <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Retrieval Strategy</label>
            <div class="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Semantic Search (Vector)</span>
                    <input type="checkbox" v-model="store.context.useSemanticRetrieval" class="form-checkbox text-blue-600 rounded">
                </label>
                <div class="h-px bg-gray-200 dark:bg-gray-700/50"></div>
                <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">Keyword Search (BM25)</span>
                     <input type="checkbox" v-model="store.context.useKeywordRetrieval" class="form-checkbox text-blue-600 rounded">
                </label>
            </div>
        </div>
    </div>
</template>
