<script setup lang="ts">
import { useSourcesStore } from '../../stores/sources.store';
import SourceInfoCard from './SourceInfoCard.vue';
import IndexProgress from './IndexProgress.vue';
import FileTypeStats from './FileTypeStats.vue';
import IndexControls from './IndexControls.vue';
import ErrorList from './ErrorList.vue';

const store = useSourcesStore();
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <!-- No Selection State -->
        <div v-if="!store.selectedSource" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div class="text-6xl mb-4 opacity-30">📋</div>
            <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                Select a source to view details
            </h3>
            <p class="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Click on a source from the list to see its indexing status, file types, and controls
            </p>
        </div>

        <!-- Details Content -->
        <div v-else class="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <div class="max-w-2xl mx-auto space-y-6">
                <!-- Source Info Card -->
                <SourceInfoCard :source="store.selectedSource" />

                <!-- Indexing Progress -->
                <IndexProgress :source="store.selectedSource" />

                <!-- Two Column Layout for Stats and Controls -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- File Type Stats -->
                    <FileTypeStats :source="store.selectedSource" />

                    <!-- Index Controls -->
                    <IndexControls :source="store.selectedSource" />
                </div>

                <!-- Error List (if any) -->
                <ErrorList :source="store.selectedSource" />
            </div>
        </div>
    </div>
</template>
