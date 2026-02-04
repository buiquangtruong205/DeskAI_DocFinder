<template>
  <MainLayout />
</template>

<script setup lang="ts">
import MainLayout from './layouts/MainLayout.vue';
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
