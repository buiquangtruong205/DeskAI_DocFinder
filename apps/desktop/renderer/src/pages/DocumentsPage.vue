<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDocumentsStore } from '../stores/documents.store';
import DocumentsHeader from '../components/documents/DocumentsHeader.vue';
import FolderTree from '../components/documents/FolderTree.vue';
import DocumentsList from '../components/documents/DocumentsList.vue';
import DocumentsPreviewPanel from '../components/documents/DocumentsPreviewPanel.vue';

const store = useDocumentsStore();

// Resizable Split Logic - Left Panel (Folder Tree)
const leftWidth = ref(25); // Percentage
const isDraggingLeft = ref(false);

const startDragLeft = () => {
    isDraggingLeft.value = true;
    document.addEventListener('mousemove', onDragLeft);
    document.addEventListener('mouseup', stopDragLeft);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDragLeft = (e: MouseEvent) => {
    if (isDraggingLeft.value) {
        const containerWidth = document.body.clientWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        // Clamp between 15% and 35%
        if (newLeftWidth > 15 && newLeftWidth < 35) {
            leftWidth.value = newLeftWidth;
        }
    }
};

const stopDragLeft = () => {
    isDraggingLeft.value = false;
    document.removeEventListener('mousemove', onDragLeft);
    document.removeEventListener('mouseup', stopDragLeft);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

// Resizable Split Logic - Right Panel (Preview)
const rightWidth = ref(35); // Percentage
const isDraggingRight = ref(false);

const startDragRight = () => {
    isDraggingRight.value = true;
    document.addEventListener('mousemove', onDragRight);
    document.addEventListener('mouseup', stopDragRight);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDragRight = (e: MouseEvent) => {
    if (isDraggingRight.value) {
        const containerWidth = document.body.clientWidth;
        const newRightWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
        // Clamp between 25% and 50%
        if (newRightWidth > 25 && newRightWidth < 50) {
            rightWidth.value = newRightWidth;
        }
    }
};

const stopDragRight = () => {
    isDraggingRight.value = false;
    document.removeEventListener('mousemove', onDragRight);
    document.removeEventListener('mouseup', stopDragRight);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

onMounted(() => {
    store.fetchDocuments();
    store.fetchFolderTree();
});
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
        <!-- Header -->
        <DocumentsHeader />

        <!-- Main Content (Three-Column Split View) -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left: Folder Tree -->
            <div 
                class="flex flex-col border-r border-gray-200 dark:border-gray-800 overflow-hidden"
                :style="{ width: `${leftWidth}%` }"
            >
                <FolderTree />
            </div>

            <!-- Left Resizer Handle -->
            <div 
                class="w-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 cursor-col-resize z-20 flex items-center justify-center transition-colors delay-150 hover:delay-0 active:bg-blue-600"
                @mousedown="startDragLeft"
            >
                <div class="h-8 w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <!-- Center: Documents List -->
            <div class="flex-1 overflow-hidden" style="min-width: 0;">
                <DocumentsList />
            </div>

            <!-- Right Resizer Handle (only show when document selected) -->
            <div 
                v-if="store.selectedDocument"
                class="w-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 cursor-col-resize z-20 flex items-center justify-center transition-colors delay-150 hover:delay-0 active:bg-blue-600"
                @mousedown="startDragRight"
            >
                <div class="h-8 w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <!-- Right: Preview Panel -->
            <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-x-4"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-4"
            >
                <div 
                    v-if="store.selectedDocument"
                    class="overflow-hidden border-l border-gray-200 dark:border-gray-800"
                    :style="{ width: `${rightWidth}%` }"
                >
                    <DocumentsPreviewPanel />
                </div>
            </Transition>
        </div>
    </div>
</template>
