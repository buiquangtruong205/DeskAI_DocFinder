<script setup lang="ts">
defineProps<{
    content: string;
}>();
</script>

<template>
    <div class="flex justify-end mb-6">
        <div class="max-w-[80%] bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md text-base leading-relaxed whitespace-pre-wrap">
            {{ content }}
        </div>
    </div>
</template>
