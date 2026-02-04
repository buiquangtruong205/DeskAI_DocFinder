<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useAskStore } from '../stores/ask.store';
import AskHeader from '../components/ask/AskHeader.vue';
import AskInput from '../components/ask/AskInput.vue';
import UserMessage from '../components/ask/UserMessage.vue';
import AIMessage from '../components/ask/AIMessage.vue';

const store = useAskStore();
const bottomRef = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
    await nextTick();
    if (bottomRef.value) {
        bottomRef.value.scrollIntoView({ behavior: 'smooth' });
    }
};

watch(() => store.messages.length, scrollToBottom);
watch(() => store.loading, scrollToBottom); // Scroll when AI starts typing

onMounted(() => {
    scrollToBottom();
});

const handleFollowUp = (question: string) => {
    store.sendMessage(question);
};
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 font-sans">
        <AskHeader />

        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
            <div class="max-w-4xl mx-auto min-h-full pb-8">
                <!-- Welcome State -->
                <div v-if="store.messages.length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-70 mt-20">
                    <div class="text-6xl mb-6 animate-pulse">✨</div>
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        Ask your knowledge base
                    </h2>
                    <p class="text-gray-500 dark:text-gray-400 text-lg max-w-lg">
                        I can analyze documents, summarize content, and answer questions based on your files.
                    </p>

                    <!-- Suggestions -->
                    <div class="grid grid-cols-2 gap-4 mt-12 w-full max-w-2xl">
                        <button class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-400 transition text-left group">
                            <span class="block text-xl mb-1">📝</span>
                            <span class="font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-500">Summarize the Q1 Report</span>
                        </button>
                        <button class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-400 transition text-left group">
                            <span class="block text-xl mb-1">⚖️</span>
                            <span class="font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-500">Compare Redis vs Memcached</span>
                        </button>
                         <button class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-green-400 transition text-left group">
                            <span class="block text-xl mb-1">🚀</span>
                            <span class="font-medium text-gray-700 dark:text-gray-200 group-hover:text-green-500">Explain the auth flow</span>
                        </button>
                         <button class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-orange-400 transition text-left group">
                            <span class="block text-xl mb-1">🐛</span>
                            <span class="font-medium text-gray-700 dark:text-gray-200 group-hover:text-orange-500">Find bugs in main.py</span>
                        </button>
                    </div>
                </div>

                <!-- Message List -->
                <template v-else>
                    <div v-for="msg in store.messages" :key="msg.id">
                        <UserMessage v-if="msg.role === 'user'" :content="msg.content" />
                        <AIMessage v-else :message="msg" @follow-up="handleFollowUp" />
                    </div>
                </template>
                
                <div ref="bottomRef" class="h-4"></div>
            </div>
        </div>

        <AskInput />
    </div>
</template>
