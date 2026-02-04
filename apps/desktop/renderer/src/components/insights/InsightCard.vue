<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { InsightCard } from '../../stores/insights.store';

const props = defineProps<{
    insight: InsightCard;
}>();

const emit = defineEmits<{
    action: [action: string, params?: any];
}>();

const router = useRouter();

const typeStyles = {
    info: {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400'
    },
    warning: {
        border: 'border-yellow-200 dark:border-yellow-800',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400'
    },
    success: {
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400'
    },
    danger: {
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400'
    }
};

const handleAction = () => {
    if (props.insight.cta) {
        emit('action', props.insight.cta.action, props.insight.cta.params);
    }
};
</script>

<template>
    <div 
        class="p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
        :class="[typeStyles[insight.type].border, typeStyles[insight.type].bg]"
    >
        <div class="flex items-start gap-3">
            <!-- Icon -->
            <span class="text-2xl flex-shrink-0" :class="typeStyles[insight.type].icon">
                {{ insight.icon }}
            </span>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 dark:text-white text-sm">
                    {{ insight.title }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {{ insight.message }}
                </p>
                
                <!-- CTA Button -->
                <button 
                    v-if="insight.cta"
                    @click="handleAction"
                    class="mt-3 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    :class="{
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50': insight.type === 'info',
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50': insight.type === 'warning',
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50': insight.type === 'success',
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50': insight.type === 'danger'
                    }"
                >
                    {{ insight.cta.label }} →
                </button>
            </div>
        </div>
    </div>
</template>
