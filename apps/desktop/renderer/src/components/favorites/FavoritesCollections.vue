<script setup lang="ts">
import { computed } from 'vue';
import { useFavoritesStore, type CollectionType } from '../../stores/favorites.store';

const store = useFavoritesStore();

// System collections (always visible)
const systemCollections = computed(() => [
  { 
    id: 'all', 
    label: 'All Favorites', 
    icon: '⭐', 
    count: store.counts.all 
  },
  { 
    id: 'pinned', 
    label: 'Pinned', 
    icon: '📌', 
    count: store.counts.pinned 
  },
  { 
    id: 'recent', 
    label: 'Recent', 
    icon: '🕐', 
    count: store.counts.recent 
  },
]);

// Sort tags by count
const topTags = computed(() => {
  return store.tags
    .map(tag => ({ 
      tag, 
      count: store.tagCounts[tag] || 0 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

const handleCollectionClick = (id: CollectionType) => {
  store.setActiveCollection(id);
};
</script>

<template>
  <div class="w-56 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
    <div class="p-4 space-y-6">
      <!-- System Collections -->
      <div class="space-y-1">
        <h3 class="text-xs font-bold uppercase text-gray-400 tracking-wider px-2 mb-2">
          Collections
        </h3>
        <button
          v-for="col in systemCollections"
          :key="col.id"
          @click="handleCollectionClick(col.id as CollectionType)"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          :class="store.activeCollection === col.id
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <span class="flex items-center gap-2">
            <span class="text-lg">{{ col.icon }}</span>
            <span>{{ col.label }}</span>
          </span>
          <span 
            class="px-2 py-0.5 text-xs rounded-full"
            :class="store.activeCollection === col.id
              ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'"
          >
            {{ col.count }}
          </span>
        </button>
      </div>

      <!-- User Folders -->
      <div v-if="store.folders.length > 0" class="space-y-1">
        <h3 class="text-xs font-bold uppercase text-gray-400 tracking-wider px-2 mb-2">
          Folders
        </h3>
        <button
          v-for="folder in store.folders"
          :key="folder.id"
          @click="handleCollectionClick(folder.id)"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          :class="store.activeCollection === folder.id
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <span class="flex items-center gap-2">
            <span class="text-lg">{{ folder.icon || '📁' }}</span>
            <span class="truncate">{{ folder.name }}</span>
          </span>
        </button>
      </div>

      <!-- Tags -->
      <div v-if="topTags.length > 0" class="space-y-2">
        <h3 class="text-xs font-bold uppercase text-gray-400 tracking-wider px-2 mb-2">
          Tags
        </h3>
        <div class="flex flex-wrap gap-2 px-2">
          <span
            v-for="{ tag, count } in topTags"
            :key="tag"
            class="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span class="text-gray-400 mr-1">#</span>{{ tag }}
            <span class="ml-1.5 text-gray-400">{{ count }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
