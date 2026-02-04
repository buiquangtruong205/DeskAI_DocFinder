<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';

const store = usePlaygroundStore();
</script>

<template>
    <div class="space-y-6">
        <!-- Top K -->
        <div>
            <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Top K Chunks</label>
                <span class="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 rounded">
                    {{ store.retrieval.topK }}
                </span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="20" 
                step="1" 
                v-model.number="store.retrieval.topK"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            >
             <div class="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>1</span>
                <span>20</span>
            </div>
        </div>

        <!-- Score Threshold -->
        <div>
           <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Score Threshold</label>
                <span class="text-sm font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 rounded">
                    {{ store.retrieval.scoreThreshold }}
                </span>
            </div>
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                v-model.number="store.retrieval.scoreThreshold"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            >
            <div class="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>Strict (1.0)</span>
                <span>Loose (0.0)</span>
            </div>
        </div>

         <!-- Hybrid Weight -->
        <div>
           <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Hybrid Weight</label>
                <span class="text-sm font-mono font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 rounded">
                    {{ store.retrieval.hybridWeight }}
                </span>
            </div>
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                v-model.number="store.retrieval.hybridWeight"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            >
            <div class="flex justify-between text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-wider">
                <span>Keyword</span>
                <span>Semantic</span>
            </div>
        </div>
    </div>
</template>
