<script setup lang="ts">
defineProps<{
    icon: string;
    label: string;
    value: string | number;
    sublabel?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}>();

const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    gray: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
};

const trendClasses = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
};

const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
};
</script>

<template>
    <div 
        class="p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
        :class="colorClasses[color || 'blue']"
    >
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl">{{ icon }}</span>
                    <span class="text-sm font-medium opacity-80">{{ label }}</span>
                </div>
                <div class="text-3xl font-bold">{{ value }}</div>
                <div v-if="sublabel" class="text-xs opacity-70 mt-1">{{ sublabel }}</div>
            </div>
            <div 
                v-if="trend && trendValue" 
                class="flex items-center gap-1 text-sm font-medium"
                :class="trendClasses[trend]"
            >
                <span>{{ trendIcons[trend] }}</span>
                <span>{{ trendValue }}</span>
            </div>
        </div>
    </div>
</template>
