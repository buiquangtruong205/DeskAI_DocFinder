<script setup lang="ts">
import { useAskStore } from '../../stores/ask.store';

const store = useAskStore();

const modes = [
    { value: 'answer', label: 'Answer', icon: '💡' },
    { value: 'summarize', label: 'Summarize', icon: '📝' },
    { value: 'explain', label: 'Explain', icon: '🧠' },
    { value: 'compare', label: 'Compare', icon: '⚖️' },
];
</script>

<template>
    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm z-20 relative">
        <div class="flex items-center gap-4">
             <!-- Mode Selector -->
            <div class="relative group">
                <select 
                    v-model="store.mode"
                    class="appearance-none pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition w-40"
                    title="Select AI Mode"
                >
                    <option v-for="mode in modes" :key="mode.value" :value="mode.value">
                         {{ mode.label }}
                    </option>
                </select>
                <!-- Custom Type Icon -->
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                     {{ modes.find(m => m.value === store.mode)?.icon }}
                </div>
                <!-- Dropdown Arrow -->
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                    ▼
                </div>
            </div>

            <!-- Context Selector (Mock) -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                <span>📚</span> All sources
            </div>
        </div>

        <button 
            @click="store.clearChat" 
            class="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            title="Clear Conversation"
        >
            <span class="text-xl">🗑️</span>
        </button>
    </div>
</template>
