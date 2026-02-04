<script setup lang="ts">
import { useDocumentsStore } from '../../stores/documents.store';
import { useRouter } from 'vue-router';
import DocumentRow from './DocumentRow.vue';
import DocumentsToolbar from './DocumentsToolbar.vue';
import type { Document } from '../../services/documents.service';

const store = useDocumentsStore();
const router = useRouter();

const handleSelect = (doc: Document) => {
    store.selectDocument(doc.id);
};

const handleCheck = (doc: Document) => {
    store.toggleDocumentSelection(doc.id);
};

const handleOpen = (doc: Document) => {
    store.revealInExplorer(doc.path);
};

const handleFavorite = (doc: Document) => {
    store.toggleFavorite(doc.id);
};

const handleReindex = (doc: Document) => {
    store.reindexDocument(doc.id);
};

const handleRemove = (doc: Document) => {
    if (confirm(`Remove "${doc.name}" from index?`)) {
        store.removeDocument(doc.id);
    }
};

const handleReveal = (doc: Document) => {
    store.revealInExplorer(doc.path);
};

const goToSources = () => {
    router.push('/sources');
};
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        <!-- Bulk Actions Toolbar -->
        <DocumentsToolbar />

        <!-- List Header -->
        <div class="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <div class="w-4"></div>
            <div class="w-10"></div>
            <div class="flex-1">Name</div>
            <div class="w-16 hidden md:block">Type</div>
            <div class="w-20 hidden lg:block text-right">Size</div>
            <div class="w-24 hidden lg:block text-right">Indexed</div>
            <div class="w-20 text-center">Status</div>
            <div class="w-28">Actions</div>
        </div>

        <!-- Document List -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">
            <!-- Empty State -->
            <div
                v-if="store.documents.length === 0 && !store.loading"
                class="flex flex-col items-center justify-center h-full p-8 text-center"
            >
                <div class="text-6xl mb-4 opacity-50">📂</div>
                <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No documents indexed yet
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                    Add a source folder to start indexing documents for search and AI
                </p>
                <button
                    @click="goToSources"
                    class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                    <span>📁</span>
                    Go to Sources
                </button>
            </div>

            <!-- Loading State -->
            <div
                v-else-if="store.loading && store.documents.length === 0"
                class="flex items-center justify-center h-full"
            >
                <div class="flex items-center gap-3 text-gray-500">
                    <span class="animate-spin text-xl">⌛</span>
                    Loading documents...
                </div>
            </div>

            <!-- Document Rows -->
            <template v-else>
                <DocumentRow
                    v-for="doc in store.documents"
                    :key="doc.id"
                    :document="doc"
                    :selected="store.selectedDocumentId === doc.id"
                    :checked="store.selectedDocumentIds.includes(doc.id)"
                    @select="handleSelect"
                    @check="handleCheck"
                    @open="handleOpen"
                    @favorite="handleFavorite"
                    @reindex="handleReindex"
                    @remove="handleRemove"
                    @reveal="handleReveal"
                />
            </template>
        </div>

        <!-- Footer Status -->
        <div class="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <span>{{ store.documents.length }} documents</span>
            <span v-if="store.filterType !== 'all'" class="text-blue-500">
                Filtered: {{ store.filterType }}
            </span>
        </div>
    </div>
</template>
