<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{
  hasFilters: boolean;
}>();

const router = useRouter();

const goToSearch = () => {
  router.push({ name: 'search' });
};
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
    <!-- No favorites yet -->
    <template v-if="!hasFilters">
      <div class="text-6xl mb-6 opacity-50">⭐</div>
      <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
        No favorites yet
      </h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        Save documents, snippets, or AI answers to access them quickly.
        Use the ⭐ button in Search or Ask to add items here.
      </p>
      <button 
        @click="goToSearch"
        class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm shadow-blue-500/30 transition-all flex items-center gap-2"
      >
        <span>🔍</span>
        Go to Search
      </button>
    </template>

    <!-- Empty after filtering -->
    <template v-else>
      <div class="text-5xl mb-4 opacity-40">🔍</div>
      <h2 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
        No favorites found
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        Try adjusting your filters or search query.
      </p>
    </template>
  </div>
</template>
