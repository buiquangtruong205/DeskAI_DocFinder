<script setup lang="ts">
import { ref } from 'vue';
import PromptEditor from './PromptEditor.vue';
import ContextSelector from './ContextSelector.vue';
import RetrievalParams from './RetrievalParams.vue';
import GenerationParams from './GenerationParams.vue';

// Section folding state
const showContext = ref(true);
const showRetrieval = ref(true);
const showGeneration = ref(true);
</script>

<template>
    <div class="h-full flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            <!-- 1. Prompt Editor (Always visible) -->
            <section>
                <PromptEditor />
            </section>

             <div class="h-px bg-gray-200 dark:bg-gray-800"></div>

            <!-- 2. Context -->
            <section>
                <button 
                    @click="showContext = !showContext"
                    class="w-full flex items-center justify-between text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <span class="flex items-center gap-2">
                        <span>📚</span> Context & Retrieval
                    </span>
                    <span class="text-gray-400 text-xs transform transition-transform" :class="showContext ? 'rotate-180' : ''">▼</span>
                </button>
                 <div v-show="showContext" class="space-y-8 pl-1">
                    <ContextSelector />
                 </div>
            </section>

             <div class="h-px bg-gray-200 dark:bg-gray-800"></div>

            <!-- 3. Retrieval Params -->
            <section>
                 <button 
                    @click="showRetrieval = !showRetrieval"
                    class="w-full flex items-center justify-between text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <span class="flex items-center gap-2">
                        <span>🔍</span> Tuning
                    </span>
                    <span class="text-gray-400 text-xs transform transition-transform" :class="showRetrieval ? 'rotate-180' : ''">▼</span>
                </button>
                <div v-show="showRetrieval" class="pl-1">
                    <RetrievalParams />
                </div>
            </section>

            <div class="h-px bg-gray-200 dark:bg-gray-800"></div>

            <!-- 4. Generation Params -->
            <section>
                 <button 
                    @click="showGeneration = !showGeneration"
                    class="w-full flex items-center justify-between text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <span class="flex items-center gap-2">
                        <span>⚙️</span> Generation
                    </span>
                    <span class="text-gray-400 text-xs transform transition-transform" :class="showGeneration ? 'rotate-180' : ''">▼</span>
                </button>
                <div v-show="showGeneration" class="pl-1 pb-8">
                    <GenerationParams />
                </div>
            </section>
        </div>
    </div>
</template>
