<script setup lang="ts">
import { ref } from 'vue';
import { useInsightsStore, type TimeRange } from '../../stores/insights.store';

const store = useInsightsStore();

const showDropdown = ref(false);

const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom' }
];

const getCurrentLabel = () => {
    return timeRangeOptions.find(o => o.value === store.timeRange)?.label || 'Select range';
};

const selectRange = (range: TimeRange) => {
    store.setTimeRange(range);
    showDropdown.value = false;
};
</script>

<template>
    <div class="relative">
        <button
            @click="showDropdown = !showDropdown"
            class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
        >
            <span class="text-sm">📅</span>
            <span>{{ getCurrentLabel() }}</span>
            <span class="text-xs ml-1">▼</span>
        </button>

        <!-- Dropdown Menu -->
        <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
            <div
                v-if="showDropdown"
                class="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
            >
                <button
                    v-for="option in timeRangeOptions"
                    :key="option.value"
                    @click="selectRange(option.value)"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': store.timeRange === option.value }"
                >
                    <span class="flex-1 text-left">{{ option.label }}</span>
                    <span v-if="store.timeRange === option.value" class="text-blue-500">✓</span>
                </button>
            </div>
        </Transition>

        <!-- Click outside to close -->
        <div
            v-if="showDropdown"
            class="fixed inset-0 z-40"
            @click="showDropdown = false"
        ></div>
    </div>
</template>
