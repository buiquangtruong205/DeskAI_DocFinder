<script setup lang="ts">
defineProps<{
    total?: number;
    time?: number;
    mode?: string;
}>();
</script>

<template>
    <div class="flex items-center justify-between px-3 py-1 text-xs text-gray-400 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div v-if="total !== undefined">
            Found {{ total }} results <span v-if="time">in {{ time }}ms</span>
        </div>
        <div v-else>
            Ready to search
        </div>
        
        <div class="flex items-center gap-2">
            <span>Mode: {{ mode || 'Hybrid' }}</span>
        </div>
    </div>
</template>
