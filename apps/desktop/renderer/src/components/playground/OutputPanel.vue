<script setup lang="ts">
import { ref } from 'vue';
import AnswerOutput from './AnswerOutput.vue';
import RetrievedChunksList from './RetrievedChunksList.vue';
import DebugInfo from './DebugInfo.vue';

const showDebug = ref(false);
</script>

<template>
    <div class="h-full flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 p-4 gap-4">
        <!-- 1. Answer (Flexible height) -->
        <div class="flex-[3] min-h-[200px] overflow-hidden">
            <AnswerOutput />
        </div>

        <!-- 2. Retrieved Chunks (Flexible height) -->
        <div class="flex-[2] min-h-[150px] overflow-hidden">
             <RetrievedChunksList />
        </div>

        <!-- 3. Debug Info (Collapsible / Fixed bottom) -->
        <div class="shrink-0">
             <button 
                @click="showDebug = !showDebug"
                class="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 hover:text-blue-500 transition-colors"
            >
                <span class="transform transition-transform" :class="showDebug ? 'rotate-90' : ''">▶</span>
                Debug Info
            </button>
            
            <div v-show="showDebug">
                <DebugInfo />
            </div>
        </div>
    </div>
</template>
