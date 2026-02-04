<script setup lang="ts">
import { computed } from 'vue';
import { useFavoritesStore } from '../../stores/favorites.store';
import type { FavoriteKind, FavoriteSort } from '../../services/favorites.service';

const store = useFavoritesStore();

const emit = defineEmits<{
  (e: 'new-folder'): void;
}>();

// Filter chips
const filterOptions: Array<{ value: FavoriteKind | 'all'; label: string; icon: string }> = [
  { value: 'all', label: 'All', icon: '📚' },
  { value: 'DOCUMENT', label: 'Docs', icon: '📄' },
  { value: 'SNIPPET', label: 'Snippets', icon: '✂️' },
  { value: 'ANSWER', label: 'Answers', icon: '💬' },
];

// Sort options
const sortOptions: Array<{ value: FavoriteSort; label: string }> = [
  { value: 'recent', label: 'Recently saved' },
  { value: 'used', label: 'Most used' },
  { value: 'kind', label: 'By kind' },
  { value: 'title', label: 'By title' },
];

const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement;
  store.setSearchQuery(target.value);
};

const handleFilterChange = (type: FavoriteKind | 'all') => {
  store.setFilterType(type);
};

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  store.setSortBy(target.value as FavoriteSort);
};
</script>

<template>
  <div class="px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 space-y-4">
    <!-- Top Row: Title + Search + Actions -->
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span class="text-2xl">⭐</span>
        Favorites
      </h1>
      
      <!-- Search Box -->
      <div class="flex-1 max-w-md">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            type="text"
            :value="store.searchQuery"
            @input="handleSearch"
            placeholder="Search favorites..."
            class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <!-- Sort Dropdown -->
      <select 
        :value="store.sortBy"
        @change="handleSortChange"
        class="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <!-- New Folder Button -->
      <button 
        @click="emit('new-folder')"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-blue-500/30 transition-all flex items-center gap-2"
      >
        <span>📁</span>
        <span class="hidden sm:inline">New Folder</span>
      </button>
    </div>

    <!-- Filter Chips -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mr-2">Filter</span>
      <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
        <button 
          v-for="opt in filterOptions" 
          :key="opt.value"
          @click="handleFilterChange(opt.value)"
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5"
          :class="store.filterType === opt.value 
            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50'"
        >
          <span>{{ opt.icon }}</span>
          <span>{{ opt.label }}</span>
          <span 
            v-if="opt.value === 'all'" 
            class="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full"
          >
            {{ store.counts.all }}
          </span>
          <span 
            v-else-if="opt.value === 'DOCUMENT'" 
            class="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full"
          >
            {{ store.counts.documents }}
          </span>
          <span 
            v-else-if="opt.value === 'SNIPPET'" 
            class="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full"
          >
            {{ store.counts.snippets }}
          </span>
          <span 
            v-else-if="opt.value === 'ANSWER'" 
            class="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full"
          >
            {{ store.counts.answers }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
