<script setup lang="ts">
import { ref } from 'vue';
import PlaygroundHeader from '../components/playground/PlaygroundHeader.vue';
import PromptPanel from '../components/playground/PromptPanel.vue';
import OutputPanel from '../components/playground/OutputPanel.vue';

// Split Pane Logic
const leftWidth = ref(40); // Percentage
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
        // Clamp between 25% and 75%
        if (newLeftWidth > 25 && newLeftWidth < 75) {
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
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-gray-950 font-sans overflow-hidden">
        <PlaygroundHeader />

        <div class="flex-1 flex overflow-hidden relative">
            <!-- Left Panel: Prompt & Config -->
            <div 
                class="h-full overflow-hidden flex flex-col border-r border-gray-200 dark:border-gray-800"
                :style="{ width: `${leftWidth}%` }"
            >
                <div class="flex-1 overflow-hidden">
                     <PromptPanel />
                </div>
            </div>

            <!-- Resizer Handle -->
            <div 
                class="absolute top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-blue-500 hover:w-1.5 transition-all opacity-0 hover:opacity-100 flex items-center justify-center group"
                :style="{ left: `${leftWidth}%`, transform: 'translateX(-50%)' }"
                @mousedown="startDrag"
            >
                <!-- Visible line on hover -->
                <div class="h-full w-px bg-blue-500 group-hover:w-full"></div>
            </div>

            <!-- Right Panel: Output & Debug -->
            <div 
                class="h-full overflow-hidden flex flex-col flex-1"
                style="min-width: 0;" 
            >
                 <OutputPanel />
            </div>
        </div>
    </div>
</template>
