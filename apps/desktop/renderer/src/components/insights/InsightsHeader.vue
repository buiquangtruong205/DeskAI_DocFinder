<script setup lang="ts">
import TimeRangePicker from './TimeRangePicker.vue';
</script>

<template>
    <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <!-- Left: Title & Subtitle -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="text-2xl">📊</span>
                Insights
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Analytics and usage statistics for your knowledge base
            </p>
        </div>

        <!-- Right: Time Range Picker -->
        <TimeRangePicker />
    </div>
</template>
