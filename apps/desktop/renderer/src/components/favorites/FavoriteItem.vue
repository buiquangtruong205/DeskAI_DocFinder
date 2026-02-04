<script setup lang="ts">
import { computed } from 'vue';
import type { Favorite, DocumentRef, SnippetRef, AnswerRef } from '../../services/favorites.service';

const props = defineProps<{
  item: Favorite;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', item: Favorite): void;
  (e: 'open', item: Favorite): void;
  (e: 'ask', item: Favorite): void;
  (e: 'pin', item: Favorite): void;
  (e: 'remove', item: Favorite): void;
}>();

// Type icons
const icon = computed(() => {
  const map: Record<string, string> = {
    'DOCUMENT': '📄',
    'SNIPPET': '✂️',
    'ANSWER': '💬'
  };
  return map[props.item.kind] || '📄';
});

// Type-specific subtitle
const subtitle = computed(() => {
  switch (props.item.kind) {
    case 'DOCUMENT': {
      const ref = props.item.ref as DocumentRef;
      // If filePath is populated on the item (root level) or ref
      const path = props.item.filePath || (ref as any).filePath; 
      if (!path) return '';
      return path.split(/[/\\]/).slice(-2).join('/');
    }
    case 'SNIPPET': {
      const ref = props.item.ref as SnippetRef;
      const path = props.item.filePath || (ref as any).filePath;
      if (!path) return '';
      return path.split(/[/\\]/).slice(-2).join('/');
    }
    case 'ANSWER': {
      const ref = props.item.ref as AnswerRef;
      return `${ref.citations?.length || 0} citations`;
    }
    default:
      return '';
  }
});

// Snippet preview text
const snippetText = computed(() => {
  if (props.item.kind === 'SNIPPET') {
    const ref = props.item.ref as SnippetRef;
    const text = ref.snippet || '';
    return text.length > 100 ? text.slice(0, 100) + '...' : text;
  }
  return null;
});

// Answer summary
const answerSummary = computed(() => {
  if (props.item.kind === 'ANSWER') {
    // Answer ref structure might differ slightly? 
    // Spec: { conversationId, answerId, citations }
    // Where is the question/answer text?
    // Service AddPayload included 'title' as "Answer: Question...".
    // Is there a 'summary' or 'text' in ref?
    // Service createAnswerPayload: ref does NOT have 'text'.
    // So assume Title holds the summary.
    return null; 
  }
  return null;
});

// Time ago
const timeAgo = computed(() => {
  const date = new Date(props.item.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
});
</script>

<template>
  <div 
    @click="emit('select', item)"
    class="group relative p-4 mb-2 mx-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer"
    :class="[
      selected 
        ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50 shadow-sm' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 overflow-hidden flex-1">
        <!-- Icon -->
        <div 
          class="mt-1 flex-shrink-0 text-2xl p-2 rounded-lg shadow-sm border transition-colors"
          :class="[
            item.kind === 'DOCUMENT' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : '',
            item.kind === 'SNIPPET' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : '',
            item.kind === 'ANSWER' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800' : ''
          ]"
        >
          {{ icon }}
        </div>
        
        <!-- Content -->
        <div class="min-w-0 flex-1">
          <!-- Title -->
          <div class="flex items-center gap-2">
            <span v-if="item.pinned" class="text-yellow-500 text-sm">📌</span>
            <h3 
              class="font-semibold text-gray-900 dark:text-gray-100 leading-snug truncate text-base" 
              :class="{ 'text-yellow-700 dark:text-yellow-400': selected }"
              :title="item.title"
            >
              {{ item.title }}
            </h3>
          </div>
          
          <!-- Subtitle -->
          <div v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate font-mono opacity-70">
            {{ subtitle }}
          </div>
          
          <!-- Snippet preview -->
          <p v-if="snippetText" class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed italic">
            "{{ snippetText }}"
          </p>
          
          <!-- Answer preview -->
          <!-- p v-if="answerSummary" ... removed as redundant if title handles it -->

          <!-- Meta -->
          <div class="flex items-center gap-3 mt-3 flex-wrap">
            <span class="text-xs text-gray-400">{{ timeAgo }}</span>
            <span v-if="item.usedCount > 0" class="text-xs text-gray-400 flex items-center gap-1">
              <span>📊</span> {{ item.usedCount }} uses
            </span>
            <span 
              v-for="tag in item.tags.slice(0, 3)" 
              :key="tag" 
              class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700"
            >
              #{{ tag }}
            </span>
            <span v-if="item.tags.length > 3" class="text-xs text-gray-400">
              +{{ item.tags.length - 3 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions (hover) -->
      <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
        <button 
          @click.stop="emit('open', item)" 
          class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-gray-200 transition-all" 
          title="Open"
        >📂</button>
        <button 
          @click.stop="emit('ask', item)" 
          class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-purple-600 shadow-sm border border-transparent hover:border-gray-200 transition-all" 
          title="Ask AI"
        >💬</button>
        <button 
          @click.stop="emit('pin', item)" 
          class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-200" 
          :class="item.pinned ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'"
          :title="item.pinned ? 'Unpin' : 'Pin'"
        >📌</button>
        <button 
          @click.stop="emit('remove', item)" 
          class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-gray-200 transition-all" 
          title="Remove"
        >🗑️</button>
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
</style>
