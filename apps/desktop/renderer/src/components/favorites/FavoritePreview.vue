<script setup lang="ts">
import { computed } from 'vue';
import { useFavoritesStore, type DocumentRef, type SnippetRef, type AnswerRef } from '../../stores/favorites.store';

const store = useFavoritesStore();

const emit = defineEmits<{
  (e: 'open'): void;
  (e: 'copy'): void;
  (e: 'ask'): void;
}>();

const item = computed(() => store.selectedItem);

// Type-specific computed properties
const isDocument = computed(() => item.value?.kind === 'DOCUMENT');
const isSnippet = computed(() => item.value?.kind === 'SNIPPET');
const isAnswer = computed(() => item.value?.kind === 'ANSWER');

const documentRef = computed(() => 
  isDocument.value ? (item.value?.ref as DocumentRef) : null
);

const snippetRef = computed(() => 
  isSnippet.value ? (item.value?.ref as SnippetRef) : null
);

const answerRef = computed(() => 
  isAnswer.value ? (item.value?.ref as AnswerRef) : null
);

const icon = computed(() => {
  if (!item.value) return '📄';
  const map: Record<string, string> = {
    'DOCUMENT': '📄',
    'SNIPPET': '✂️',
    'ANSWER': '💬'
  };
  return map[item.value.kind] || '📄';
});

const typeLabel = computed(() => {
  if (!item.value) return 'Unknown';
  const map: Record<string, string> = {
    'DOCUMENT': 'Document',
    'SNIPPET': 'Snippet',
    'ANSWER': 'AI Answer'
  };
  return map[item.value.kind] || 'Unknown';
});

const formatDate = (dateStr: string | number) => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleCopySnippet = () => {
  if (snippetRef.value?.snippet) {
    navigator.clipboard.writeText(snippetRef.value.snippet);
  }
};
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
    <!-- Empty State -->
    <div v-if="!item" class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
      <span class="text-6xl mb-4 opacity-30 grayscale">⭐</span>
      <p class="text-lg font-medium text-gray-500">Select a favorite to preview</p>
      <p class="text-sm">View details and content here.</p>
    </div>

    <div v-else class="flex flex-col h-full animate-fadeIn">
      <!-- Header -->
      <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <div class="flex items-start gap-4">
          <div 
            class="p-3 rounded-xl text-3xl shadow-sm"
            :class="[
              isDocument ? 'bg-blue-50 dark:bg-blue-900/30' : '',
              isSnippet ? 'bg-green-50 dark:bg-green-900/30' : '',
              isAnswer ? 'bg-purple-50 dark:bg-purple-900/30' : ''
            ]"
          >
            {{ icon }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span v-if="item.pinned" class="text-yellow-500">📌</span>
              <h2 class="font-bold text-xl text-gray-800 dark:text-gray-100 leading-tight truncate" :title="item.title">
                {{ item.title }}
              </h2>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ typeLabel }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div class="flex flex-col">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Saved</span>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Used</span>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ item.usedCount }} times</span>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="item.tags.length > 0" class="flex flex-wrap gap-2 mt-4">
          <span 
            v-for="tag in item.tags" 
            :key="tag" 
            class="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
        <button 
          @click="emit('open')" 
          class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
        >
          <span v-if="isDocument || isSnippet">📂</span>
          <span v-else>🔗</span>
          <span v-if="isDocument">Open File</span>
          <span v-else-if="isSnippet">Jump to Location</span>
          <span v-else>Open Citations</span>
        </button>
        <button 
          v-if="isSnippet"
          @click="handleCopySnippet" 
          class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-200 shadow-sm"
        >
          📋 Copy
        </button>
        <button 
          @click="emit('ask')" 
          class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-200 shadow-sm"
        >
          💬 Ask
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-[#0d1117]">
        <!-- Document preview -->
        <div v-if="isDocument && documentRef" class="space-y-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">File Info</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Path</span>
                <span class="font-mono text-gray-700 dark:text-gray-300 truncate max-w-[200px]" :title="item.filePath">
                  {{ item.filePath || 'Unknown' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">ID</span>
                <span class="font-mono text-gray-700 dark:text-gray-300">{{ documentRef.fileId }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Snippet preview -->
        <div v-if="isSnippet && snippetRef" class="space-y-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Snippet</span>
              <span v-if="snippetRef.start" class="text-xs text-gray-400">
                Lines {{ snippetRef.start }}–{{ snippetRef.end }}
              </span>
            </div>
            <div class="p-4">
              <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{{ snippetRef.snippet }}</p>
            </div>
          </div>
          <div class="text-xs text-gray-500 font-mono truncate">
            From: {{ item.filePath || 'Unknown' }}
          </div>
        </div>

        <!-- Answer preview -->
        <div v-if="isAnswer && answerRef" class="space-y-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Question</h3>
            <!-- Title acts as the question summary -->
            <p class="text-gray-700 dark:text-gray-300">{{ item.title }}</p>
          </div>
          
          <div v-if="answerRef.citations?.length" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Citations ({{ answerRef.citations.length }})
              </span>
            </div>
            <div class="p-4 text-sm text-gray-500">
                <!-- Citation details require hydration. Showing count only for MVP. -->
                {{ answerRef.citations.length }} sources referenced.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
</style>
