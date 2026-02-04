<script setup lang="ts">
const emit = defineEmits<{
    (e: 'open'): void;
    (e: 'ask'): void;
    (e: 'save'): void;
    (e: 'copy'): void;
}>();
</script>

<template>
    <div class="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button @click="emit('open')" class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            📂 Mở
        </button>
        <button @click="emit('ask')" class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            💬 Hỏi
        </button>
        <button @click="emit('save')" class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            ⭐ Lưu
        </button>
        <button @click="emit('copy')" class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            📋 Sao chép
        </button>
        
        <div class="flex-grow"></div>
        
        <button class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">
            Thêm ▼
        </button>
    </div>
</template>
