<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Top Bar (Optional, can act as drag region) -->
      <div class="h-8 bg-white border-b border-gray-200 w-full flex-shrink-0 drag-region" style="-webkit-app-region: drag;">
          <!-- Controls placeholder if managed by OS or custom -->
      </div>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-0">
         <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
         </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../components/layout/Sidebar.vue';
</script>

<style scoped>
/* Ensure the drag region doesn't block interactions elsewhere */
.drag-region {
    -webkit-user-select: none;
}
</style>
