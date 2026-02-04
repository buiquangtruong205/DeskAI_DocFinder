<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDocumentsStore } from '../../stores/documents.store';
import { formatRelativeTime } from '../../services/documents.service';

const store = useDocumentsStore();

const showTagEditor = ref(false);
const editableTags = ref<string[]>([]);
const newTagInput = ref('');

const selectedDoc = computed(() => store.selectedDocument);

const icon = computed(() => {
    if (!selectedDoc.value) return '📄';
    const map: Record<string, string> = {
        'markdown': '📄',
        'pdf': '📕',
        'python': '🐍',
        'code': '💻',
        'text': '📝',
        'json': '📋'
    };
    return map[selectedDoc.value.type] || '📄';
});

const lastModified = computed(() => {
    if (!selectedDoc.value?.lastModified) return 'Unknown';
    return new Date(selectedDoc.value.lastModified).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

const lastIndexed = computed(() => {
    if (!selectedDoc.value?.lastIndexed) return 'Unknown';
    return formatRelativeTime(selectedDoc.value.lastIndexed);
});

const handleOpen = () => {
    if (selectedDoc.value) {
        store.openDocument(selectedDoc.value.path);
    }
};

const handleCopy = async () => {
    if (selectedDoc.value?.content) {
        try {
            await navigator.clipboard.writeText(selectedDoc.value.content);
            // Could show a toast notification here
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
};

const handleAsk = () => {
    // Navigate to Ask page with this document as context
    console.log('Ask AI about:', selectedDoc.value?.name);
};

const handleFavorite = () => {
    if (selectedDoc.value) {
        store.toggleFavorite(selectedDoc.value.id);
    }
};

const startTagEdit = () => {
    if (selectedDoc.value) {
        editableTags.value = [...selectedDoc.value.tags];
        showTagEditor.value = true;
    }
};

const addTag = () => {
    const tag = newTagInput.value.trim().toLowerCase();
    if (tag && !editableTags.value.includes(tag)) {
        editableTags.value.push(tag);
        newTagInput.value = '';
    }
};

const removeTag = (tag: string) => {
    editableTags.value = editableTags.value.filter(t => t !== tag);
};

const saveTags = () => {
    if (selectedDoc.value) {
        store.updateTags(selectedDoc.value.id, editableTags.value);
        showTagEditor.value = false;
    }
};

const cancelTagEdit = () => {
    showTagEditor.value = false;
    newTagInput.value = '';
};
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        <!-- Empty State -->
        <div
            v-if="!selectedDoc"
            class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50 dark:bg-gray-900/50"
        >
            <span class="text-6xl mb-4 opacity-30 grayscale">📄</span>
            <p class="text-lg font-medium text-gray-500">Select a document to preview</p>
            <p class="text-sm">View details, content, and metadata here</p>
        </div>

        <!-- Preview Content -->
        <div v-else class="flex flex-col h-full">
            <!-- Header -->
            <div class="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div class="flex items-start gap-4">
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-3xl shadow-sm">
                        {{ icon }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h2 class="font-bold text-xl text-gray-800 dark:text-gray-100 leading-tight truncate">
                                {{ selectedDoc.name }}
                            </h2>
                            <button
                                @click="handleFavorite"
                                class="text-xl hover:scale-110 transition-transform"
                                :title="selectedDoc.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                            >
                                {{ selectedDoc.isFavorite ? '⭐' : '☆' }}
                            </button>
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all font-mono opacity-80">
                            {{ selectedDoc.path }}
                        </div>
                    </div>
                </div>

                <!-- Metadata Grid -->
                <div class="grid grid-cols-3 gap-4 mt-6 text-sm">
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300 uppercase">{{ selectedDoc.type }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Size</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ selectedDoc.size }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                        <span
                            class="font-medium capitalize"
                            :class="{
                                'text-green-600': selectedDoc.status === 'indexed',
                                'text-red-600': selectedDoc.status === 'error',
                                'text-amber-600': selectedDoc.status === 'pending'
                            }"
                        >
                            {{ selectedDoc.status }}
                        </span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Modified</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ lastModified }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Indexed</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ lastIndexed }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Source</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300 truncate">{{ selectedDoc.source }}</span>
                    </div>
                </div>

                <!-- Tags Section -->
                <div class="mt-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tags</span>
                        <button
                            @click="startTagEdit"
                            class="text-xs text-blue-500 hover:text-blue-600 font-medium"
                        >
                            Edit
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <span
                            v-for="tag in selectedDoc.tags"
                            :key="tag"
                            class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-sm"
                        >
                            #{{ tag }}
                        </span>
                        <span
                            v-if="selectedDoc.tags.length === 0"
                            class="text-sm text-gray-400 italic"
                        >
                            No tags
                        </span>
                    </div>
                </div>

                <!-- Error Message -->
                <div
                    v-if="selectedDoc.errorMessage"
                    class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                    <div class="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                        <span>❌</span>
                        <span>{{ selectedDoc.errorMessage }}</span>
                    </div>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <button
                    @click="handleOpen"
                    class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex justify-center items-center gap-2"
                >
                    <span>📂</span>
                    Open Full
                </button>
                <button
                    @click="handleCopy"
                    class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-200 shadow-sm"
                    title="Copy content"
                >
                    📋
                </button>
                <button
                    @click="handleAsk"
                    class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-200 shadow-sm"
                    title="Ask AI about this file"
                >
                    💬
                </button>
            </div>

            <!-- Content Preview -->
            <div class="flex-1 overflow-y-auto p-0 relative bg-gray-50 dark:bg-[#0d1117]">
                <div v-if="store.previewLoading" class="flex items-center justify-center h-full text-gray-500 gap-2">
                    <span class="animate-spin text-xl">⌛</span>
                    <span class="font-medium">Loading preview...</span>
                </div>
                <div v-else-if="selectedDoc.content" class="text-sm font-mono leading-relaxed overflow-x-auto">
                    <div class="flex">
                        <div class="flex-shrink-0 flex flex-col items-end px-3 py-4 bg-gray-100 dark:bg-gray-800/30 border-r border-gray-200 dark:border-gray-800 text-gray-400 select-none text-xs">
                            <span v-for="i in (selectedDoc.content.split('\n').length)" :key="i" class="leading-relaxed">{{ i }}</span>
                        </div>
                        <pre class="p-4 text-gray-800 dark:text-gray-300 whitespace-pre-wrap flex-1">{{ selectedDoc.content }}</pre>
                    </div>
                </div>
                <div v-else class="flex items-center justify-center h-full text-gray-400">
                    <span>No preview available</span>
                </div>
            </div>
        </div>

        <!-- Tag Editor Modal -->
        <div
            v-if="showTagEditor"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            @click.self="cancelTagEdit"
        >
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-96 p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Tags</h3>

                <!-- Current Tags -->
                <div class="flex flex-wrap gap-2 mb-4 min-h-[40px] p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span
                        v-for="tag in editableTags"
                        :key="tag"
                        class="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-sm"
                    >
                        #{{ tag }}
                        <button
                            @click="removeTag(tag)"
                            class="text-blue-400 hover:text-blue-600 ml-1"
                        >
                            ×
                        </button>
                    </span>
                    <span v-if="editableTags.length === 0" class="text-gray-400 text-sm">No tags</span>
                </div>

                <!-- Add Tag Input -->
                <div class="flex gap-2 mb-6">
                    <input
                        v-model="newTagInput"
                        @keyup.enter="addTag"
                        type="text"
                        placeholder="Add tag..."
                        class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        @click="addTag"
                        class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        Add
                    </button>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-3">
                    <button
                        @click="cancelTagEdit"
                        class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="saveTags"
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Save Tags
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
