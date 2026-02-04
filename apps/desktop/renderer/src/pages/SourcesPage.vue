<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSourcesStore } from '../stores/sources.store';
import SourcesHeader from '../components/sources/SourcesHeader.vue';
import SourceList from '../components/sources/SourceList.vue';
import SourceDetails from '../components/sources/SourceDetails.vue';
import AddSourceDialog from '../components/sources/AddSourceDialog.vue';
import IndexingStatusBar from '../components/sources/IndexingStatusBar.vue';

const store = useSourcesStore();

// Resizable Split Logic
const leftWidth = ref(35); // Percentage
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
        const containerWidth = document.body.clientWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        // Clamp between 25% and 50%
        if (newLeftWidth > 25 && newLeftWidth < 50) {
            leftWidth.value = newLeftWidth;
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

onMounted(() => {
    store.fetchSources();
});
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
        <!-- Header -->
        <SourcesHeader />

        <!-- Main Content (Split View) -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left: Sources List -->
            <div 
                class="flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden"
                :style="{ width: `${leftWidth}%` }"
            >
                <SourceList />
            </div>

            <!-- Resizer Handle -->
            <div 
                class="w-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 cursor-col-resize z-20 flex items-center justify-center transition-colors delay-150 hover:delay-0 active:bg-blue-600"
                @mousedown="startDrag"
            >
                <div class="h-8 w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <!-- Right: Source Details -->
            <div class="flex-1 overflow-hidden" style="min-width: 0;">
                <SourceDetails />
            </div>
        </div>

        <!-- Status Bar -->
        <IndexingStatusBar />

        <!-- Add Source Dialog -->
        <AddSourceDialog />
    </div>
</template>
