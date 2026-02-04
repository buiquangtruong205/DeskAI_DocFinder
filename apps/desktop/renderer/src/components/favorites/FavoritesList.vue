<script setup lang="ts">
import { useFavoritesStore } from '../../stores/favorites.store';
import type { Favorite } from '../../services/favorites.service';
import FavoriteItem from './FavoriteItem.vue';
import FavoriteEmptyState from './FavoriteEmptyState.vue';

const store = useFavoritesStore();

const emit = defineEmits<{
  (e: 'open', item: Favorite): void;
  (e: 'ask', item: Favorite): void;
}>();

const handleSelect = (item: Favorite) => {
  store.selectItem(item);
};

const handleOpen = (item: Favorite) => {
  emit('open', item);
};

const handleAsk = (item: Favorite) => {
  emit('ask', item);
};

const handlePin = async (item: Favorite) => {
  await store.togglePin(item.id);
};

const handleRemove = async (item: Favorite) => {
  await store.removeFavorite(item.id);
};
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
    <!-- Loading -->
    <div v-if="store.loading" class="flex-1 flex items-center justify-center text-gray-500 gap-2">
      <span class="animate-spin text-xl">⌛</span>
      <span class="font-medium">Loading favorites...</span>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="p-4 m-4 text-red-500 text-center bg-red-50 dark:bg-red-900/20 rounded-lg">
      {{ store.error }}
    </div>

    <!-- Empty State -->
    <FavoriteEmptyState 
      v-else-if="store.filteredFavorites.length === 0" 
      :hasFilters="store.filterType !== 'all' || store.searchQuery.trim() !== '' || store.activeCollection !== 'all'"
    />

    <!-- List -->
    <div v-else class="flex-1 overflow-y-auto py-2 scrollbar-thin">
      <FavoriteItem
        v-for="item in store.filteredFavorites"
        :key="item.id"
        :item="item"
        :selected="item.id === store.selectedId"
        @select="handleSelect"
        @open="handleOpen"
        @ask="handleAsk"
        @pin="handlePin"
        @remove="handleRemove"
      />
    </div>

    <!-- Footer Stats -->
    <div class="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 flex items-center justify-between">
      <span>{{ store.filteredFavorites.length }} favorite{{ store.filteredFavorites.length !== 1 ? 's' : '' }}</span>
      <span v-if="store.activeCollection !== 'all'" class="capitalize">{{ store.activeCollection }}</span>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}
</style>
