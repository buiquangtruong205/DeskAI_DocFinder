<script setup lang="ts">
import { ref } from 'vue';
import { useAskStore } from '../../stores/ask.store';

const store = useAskStore();
const input = ref('');

const send = () => {
    if (!input.value.trim() || store.loading) return;
    store.sendMessage(input.value);
    input.value = '';
};

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
};
</script>

<template>
    <div class="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div class="max-w-4xl mx-auto relative group">
            <!-- Glow effect -->
            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 pl-4 pr-2 flex items-end gap-2 shadow-sm">
                <!-- Attachment Button -->
                <button class="mb-1.5 p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <span class="text-xl">📎</span>
                </button>

                <textarea
                    v-model="input"
                    @keydown="handleKeydown"
                    placeholder="Ask something..."
                    rows="1"
                    class="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 py-3 resize-none max-h-32 text-base leading-relaxed scrollbar-hide"
                    style="min-height: 48px;"
                ></textarea>

                <!-- Send Button -->
                <button 
                    @click="send" 
                    :disabled="!input.trim() || store.loading"
                    class="mb-1 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center w-10 h-10"
                >
                    <span v-if="store.loading" class="animate-spin text-lg">⌛</span>
                    <span v-else class="text-lg translate-x-0.5 -translate-y-0.5">➤</span>
                </button>
            </div>
        
            <div class="mt-2 flex justify-between px-2 text-xs text-gray-400">
                <div class="flex gap-4">
                    <span class="hover:text-gray-600 cursor-pointer flex items-center gap-1">⚙️ Adv. Options</span>
                    <span>TopK: 5</span>
                    <span>Temp: 0.2</span>
                </div>
                <div>
                     Markdown supported
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
