<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';

const store = usePlaygroundStore();
</script>

<template>
    <div class="space-y-6">
        <!-- Model Selector -->
        <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Model</label>
            <select 
                v-model="store.generation.model"
                class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
                <option value="gpt-4o">GPT-4o (Smartest)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</option>
                 <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            </select>
        </div>

        <!-- Temperature -->
        <div>
           <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Temperature</label>
                <span class="text-sm font-mono font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 rounded">
                    {{ store.generation.temperature }}
                </span>
            </div>
             <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                v-model.number="store.generation.temperature"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            >
            <div class="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                <span>Deterministic</span>
                <span>Creative</span>
            </div>
        </div>

        <!-- Max Tokens -->
        <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Max Tokens</label>
             <div class="flex items-center gap-2">
                <input 
                    type="number" 
                    v-model.number="store.generation.maxTokens"
                    class="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
                >
             </div>
             <p class="text-[10px] text-gray-400 mt-1">Limit response length to save costs.</p>
        </div>

        <!-- Answer Style -->
         <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Answer Style</label>
            <div class="grid grid-cols-3 gap-2">
                <button 
                    v-for="style in ['concise', 'detailed', 'bullet_points']" 
                    :key="style"
                    @click="store.generation.answerStyle = style as any"
                    class="px-2 py-2 text-xs font-medium rounded-lg border capitalize transition-all"
                    :class="store.generation.answerStyle === style 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                >
                    {{ style.replace('_', ' ') }}
                </button>
            </div>
        </div>
    </div>
</template>
