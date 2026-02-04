<script setup lang="ts">
import { ref } from 'vue';
import { useDocumentsStore } from '../../stores/documents.store';

const store = useDocumentsStore();
const searchInput = ref('');
const showSortMenu = ref(false);

const sortOptions = [
    { key: 'name', label: 'Name', icon: '🔤' },
    { key: 'lastIndexed', label: 'Last indexed', icon: '📅' },
    { key: 'lastModified', label: 'Last modified', icon: '✏️' },
    { key: 'size', label: 'Size', icon: '📊' }
] as const;

const handleSearch = () => {
    store.setSearchQuery(searchInput.value);
};

const handleSort = (key: 'name' | 'lastIndexed' | 'lastModified' | 'size') => {
    store.setSort(key);
    showSortMenu.value = false;
};

const getSortLabel = () => {
    const option = sortOptions.find(o => o.key === store.sortBy);
    return option?.label || 'Sort';
};
</script>

<template>
    <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <!-- Left: Title & Subtitle -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="text-2xl">📄</span>
                Documents
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Browse and manage indexed files
            </p>
        </div>

        <!-- Right: Search, Sort, View Toggle -->
        <div class="flex items-center gap-3">
            <!-- Search Input -->
            <div class="relative">
                <input
                    v-model="searchInput"
                    @input="handleSearch"
                    type="text"
                    placeholder="Search in documents..."
                    class="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            <!-- Sort Dropdown -->
            <div class="relative">
                <button
                    @click="showSortMenu = !showSortMenu"
                    class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                    <span>{{ getSortLabel() }}</span>
                    <span class="text-xs">{{ store.sortOrder === 'asc' ? '↑' : '↓' }}</span>
                </button>

                <!-- Dropdown Menu -->
                <div
                    v-if="showSortMenu"
                    class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                    <button
                        v-for="option in sortOptions"
                        :key="option.key"
                        @click="handleSort(option.key)"
                        class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': store.sortBy === option.key }"
                    >
                        <span>{{ option.icon }}</span>
                        <span>{{ option.label }}</span>
                        <span v-if="store.sortBy === option.key" class="ml-auto text-xs">
                            {{ store.sortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                    </button>
                </div>
            </div>

            <!-- View Toggle -->
            <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                    @click="store.setViewMode('list')"
                    class="p-2 rounded-md transition-colors"
                    :class="store.viewMode === 'list' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                    title="List view"
                >
                    ☰
                </button>
                <button
                    @click="store.setViewMode('grid')"
                    class="p-2 rounded-md transition-colors"
                    :class="store.viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                    title="Grid view"
                >
                    ▦
                </button>
            </div>
        </div>
    </div>

    <!-- Click outside to close sort menu -->
    <div
        v-if="showSortMenu"
        class="fixed inset-0 z-40"
        @click="showSortMenu = false"
    ></div>
</template>
