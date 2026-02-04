<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    modelValue: any;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
    (e: 'reset'): void;
}>();

const filters = ref({
    type: 'all',
    source: 'all',
    date: 'all',
});

// Sync local state
watch(() => props.modelValue, (newVal) => {
    filters.value = { ...newVal };
}, { deep: true, immediate: true });

watch(filters, (newVal) => {
    emit('update:modelValue', newVal);
}, { deep: true });

const resetFilters = () => {
    filters.value = { type: 'all', source: 'all', date: 'all' };
    emit('reset');
};

// Helper function to set a filter
const setFilter = (key: keyof typeof filters.value, value: any) => {
    filters.value[key] = value;
};

const filterGroups = [
    {
        key: 'type' as keyof typeof filters.value,
        label: 'Type',
        options: [
            { value: 'all', label: 'All' },
            { value: 'doc', label: 'Doc' },
            { value: 'code', label: 'Code' },
            { value: 'pdf', label: 'PDF' },
        ]
    },
    {
        key: 'date' as keyof typeof filters.value,
        label: 'Date',
        options: [
            { value: 'all', label: 'Any time' },
            { value: 'today', label: 'Today' },
            { value: '7d', label: 'This week' },
        ]
    }
];
</script>

<template>
    <div class="flex items-center gap-4 py-1 overflow-x-auto no-scrollbar">
        <!-- Type Filter -->
        <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</span>
            <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button 
                    v-for="opt in [
                        { label: 'Tất cả', value: 'all' },
                        { label: 'Văn bản', value: 'doc' },
                        { label: 'Mã', value: 'code' },
                        { label: 'PDF', value: 'pdf' }
                    ]"
                    :key="opt.value"
                    @click="setFilter('type', opt.value)"
                    class="px-3 py-1 text-sm rounded-md transition-all font-medium"
                    :class="modelValue.type === opt.value ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                >
                    {{ opt.label }}
                </button>
            </div>
        </div>

        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>

        <!-- Date Filter -->
        <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày</span>
             <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button 
                     v-for="opt in [
                        { label: 'Mọi lúc', value: 'all' },
                        { label: 'Hôm nay', value: 'today' },
                        { label: 'Tuần này', value: 'week' }
                    ]"
                    :key="opt.value"
                    @click="setFilter('date', opt.value)"
                    class="px-3 py-1 text-sm rounded-md transition-all font-medium"
                    :class="modelValue.date === opt.value ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                >
                    {{ opt.label }}
                </button>
            </div>
        </div>

        <div class="flex-grow"></div>

        <button 
            v-if="filters.type !== 'all' || filters.date !== 'all' || filters.source !== 'all'"
            @click="resetFilters" 
            class="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"
        >
            <span>🗑️</span> Reset
        </button>
    </div>
</template>
