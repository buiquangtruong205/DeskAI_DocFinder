<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoritesStore, type Favorite } from '../stores/favorites.store';
import FavoritesHeader from '../components/favorites/FavoritesHeader.vue';
import FavoritesCollections from '../components/favorites/FavoritesCollections.vue';
import FavoritesList from '../components/favorites/FavoritesList.vue';
import FavoritePreview from '../components/favorites/FavoritePreview.vue';

const store = useFavoritesStore();
const router = useRouter();

// Resizable Split Logic
const listWidth = ref(45); // Percentage
const isDragging = ref(false);

const startDrag = () => {
  isDragging.value = true;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const onDrag = (e: MouseEvent) => {
  if (isDragging.value) {
    // Get container (excluding left sidebar ~224px)
    const container = document.getElementById('favorites-main');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp between 30% and 70%
    if (newWidth > 30 && newWidth < 70) {
      listWidth.value = newWidth;
    }
  }
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// Handlers
const handleOpen = async (item: Favorite) => {
  await store.openFavorite(item.id);
};

const handleAsk = (item: Favorite) => {
  // Navigate to Ask with context
  // TODO: Pass the favorite context to Ask page
  router.push({ name: 'ask' });
};

const handlePreviewOpen = async () => {
  if (store.selectedItem) {
    await store.openFavorite(store.selectedItem.id);
  }
};

const handlePreviewAsk = () => {
  if (store.selectedItem) {
    router.push({ name: 'ask' });
  }
};

const handleNewFolder = () => {
  // TODO: Open dialog
  const name = prompt('Enter folder name:');
  if (name && name.trim()) {
    store.createFolder(name.trim());
  }
};

// Load data on mount
onMounted(() => {
  store.loadFavorites();
});

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans cursor-default select-none overflow-hidden">
    <!-- Header -->
    <FavoritesHeader @new-folder="handleNewFolder" />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Collections Sidebar -->
      <FavoritesCollections />

      <!-- Main Area (List + Preview) -->
      <div id="favorites-main" class="flex-1 flex overflow-hidden">
        <!-- Middle: List -->
        <div 
          class="flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800"
          :style="{ width: `${listWidth}%` }"
        >
          <FavoritesList 
            @open="handleOpen"
            @ask="handleAsk"
          />
        </div>

        <!-- Resizer Handle -->
        <div 
          class="w-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 cursor-col-resize z-20 flex items-center justify-center transition-colors delay-150 hover:delay-0 active:bg-blue-600 flex-shrink-0"
          @mousedown="startDrag"
        >
          <div class="h-8 w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        <!-- Right: Preview Pane -->
        <div class="flex-1 overflow-hidden" style="min-width: 0;">
          <FavoritePreview 
            @open="handlePreviewOpen"
            @ask="handlePreviewAsk"
          />
        </div>
      </div>
    </div>
  </div>
</template>
