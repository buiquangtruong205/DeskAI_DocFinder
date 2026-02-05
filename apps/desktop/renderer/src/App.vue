<template>
  <MainLayout />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSettingsStore } from './stores/settings.store';
import MainLayout from './layouts/MainLayout.vue';

const settingsStore = useSettingsStore();

// Load settings on app start
onMounted(() => {
  settingsStore.loadSettings();
});
</script>

<style>
/* Global resets or base styles if needed, though Tailwind likely handles most */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  @apply antialiased;
}
</style>
