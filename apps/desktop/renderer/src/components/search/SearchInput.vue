<script setup lang="ts">
import { computed } from 'vue';
import { useSearchStore } from '../../stores/search.store';

const store = useSearchStore();

const searchModes = [
    { value: 'hybrid', label: 'Hybrid', icon: '⚡' },
    { value: 'keyword', label: 'Keyword', icon: '🔑' },
    { value: 'semantic', label: 'Semantic', icon: '🧠' },
];

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        store.performSearch();
    }
};

const inputValue = computed({
    get: () => store.query,
    set: (val) => store.query = val
});
</script>

<template>
    <div class="relative group z-50">
        <!-- Floating Glassmorphism Layer (Reduced blur and opacity for cleaner look) -->
        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-[2px] opacity-20 group-hover:opacity-40 transition duration-300"></div>
        
        <div class="relative flex items-center w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1.5 transition-transform duration-200 transform">
            <div class="flex-shrink-0 pl-2 pr-2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <span v-if="store.loading" class="animate-spin inline-block text-sm">⌛</span>
                <span v-else class="text-lg">🔍</span>
            </div>
            
            <input 
                v-model="inputValue"
                @keydown="handleKeydown"
                type="text" 
                class="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm font-medium py-1"
                placeholder="Tìm kiếm tài liệu, mã nguồn, hoặc hỏi..."
                autofocus
            />

            <!-- Clear Button -->
            <button 
                v-if="inputValue" 
                @click="store.clearSearch()" 
                class="mx-1.5 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors text-xs"
                title="Clear search"
            >
                ✕
            </button>

            <div class="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <!-- Mode Selector -->
             <div class="relative">
                <select 
                    v-model="store.mode"
                    @change="store.performSearch()"
                    class="appearance-none bg-transparent font-medium text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md pl-2 pr-6 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/20"
                >
                    <option v-for="m in searchModes" :key="m.value" :value="m.value">
                        {{ m.icon }} {{ m.label }}
                    </option>
                </select>
                <div class="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                    ▼
                </div>
            </div>
        </div>
    </div>
</template>
