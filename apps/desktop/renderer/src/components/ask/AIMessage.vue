<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '../../stores/ask.store';
import CitationCard from './CitationCard.vue';

const props = defineProps<{
    message: Message;
}>();

const emit = defineEmits<{
    (e: 'follow-up', question: string): void;
}>();

const isTyping = computed(() => props.message.loading && !props.message.content);
</script>

<template>
    <div class="flex items-start gap-4 mb-8 group animate-fadeIn">
        <!-- AI Avatar -->
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg z-10">
            <span v-if="message.loading" class="animate-spin text-sm">✨</span>
            <span v-else class="text-sm font-bold">AI</span>
        </div>

        <div class="flex-1 min-w-0 space-y-4">
            <!-- Loading State -->
            <div v-if="isTyping" class="flex items-center gap-2 text-gray-500 animate-pulse mt-2">
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                <span class="text-sm ml-2 font-medium">Reading documents...</span>
            </div>

            <!-- Main Answer -->
            <div v-else>
                <div class="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-100 leading-7 text-base bg-white dark:bg-gray-800/50 p-6 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-800 shadow-sm relative group-hover:shadow-md transition-shadow">
                     <!-- Toolbar -->
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-lg p-1">
                        <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-500" title="Copy">📋</button>
                        <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-yellow-500" title="Save">⭐</button>
                    </div>

                    <div class="whitespace-pre-wrap">{{ message.content }}</div>
                </div>

                <!-- Citations Grid -->
                <div v-if="message.citations?.length" class="mt-4">
                    <h4 class="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                        <span>📚</span> Sources Used
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CitationCard 
                            v-for="citation in message.citations" 
                            :key="citation.id" 
                            :citation="citation" 
                        />
                    </div>
                </div>

                <!-- Follow-up Suggestions -->
                <div v-if="message.followUps?.length" class="mt-4">
                     <h4 class="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
                        <span>💡</span> Suggested Follow-ups
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        <button 
                            v-for="question in message.followUps" 
                            :key="question"
                            @click="emit('follow-up', question)"
                            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left"
                        >
                            {{ question }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
