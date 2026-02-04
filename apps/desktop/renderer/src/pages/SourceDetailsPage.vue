<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSourcesStore } from '../stores/sources.store';
import { listDocuments, openDocument, revealInExplorer, type Document } from '../services/documents.service';
import { ArrowLeft, FolderOpen, FileText, FileCode, File, Search, RefreshCw, Folder } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const sourcesStore = useSourcesStore();

const sourceId = route.params.id as string;
const source = computed(() => sourcesStore.sources.find(s => s.id === sourceId));

const documents = ref<Document[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const error = ref<string | null>(null);

const filteredDocuments = computed(() => {
    if (!searchQuery.value) return documents.value;
    const query = searchQuery.value.toLowerCase();
    console.log('[SourceDetails] Filtering docs count:', documents.value.length, 'Query:', query);
    return documents.value.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        doc.type.toLowerCase().includes(query)
    );
});

const loadDocuments = async () => {
    console.log('[SourceDetails] loadDocuments called for sourceId:', sourceId);
    if (!sourceId) return;
    loading.value = true;
    error.value = null;
    try {
        documents.value = await listDocuments({ sourceId });
        console.log('[SourceDetails] Loaded documents:', documents.value.length);
    } catch (err: any) {
        console.error('Failed to load documents:', err);
        error.value = 'Failed to load documents for this source.';
    } finally {
        loading.value = false;
    }
};

const handleOpen = async (doc: Document) => {
    try {
        await revealInExplorer(doc.path);
    } catch (err) {
        console.error('Failed to open document:', err);
    }
};

const handleOpenFile = async (doc: Document) => {
    try {
        await openDocument(doc.path);
    } catch (err) {
        console.error('Failed to open file:', err);
    }
};

const goBack = () => {
    router.back();
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
};

const getFileIcon = (type: string) => {
    if (type === 'markdown') return FileText;
    if (type === 'code' || type === 'python' || type === 'json') return FileCode;
    return File;
};

// Retry/Reindex wrapper if needed (not implemented in this view but good to have placeholder)
const refresh = () => {
    loadDocuments();
    sourcesStore.fetchSources(); // Refresh source stats too
};

onMounted(() => {
    console.log('[SourceDetails] Mounted. Params:', route.params);
    if (!sourcesStore.sources.length) {
        sourcesStore.fetchSources();
    }
    loadDocuments();
});
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <!-- Header -->
        <div class="px-6 py-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 flex items-center gap-4">
            <button @click="goBack" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Back">
                <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <Folder class="w-5 h-5 text-blue-500" />
                    <h1 class="text-lg font-semibold">{{ source?.name || 'Unknown Source' }}</h1>
                </div>
                <div class="text-xs text-gray-500 flex gap-3 mt-1" v-if="source">
                    <span>{{ source.totalFiles }} files</span>
                    <span>•</span>
                    <span>{{ source.status }}</span>
                    <span>•</span>
                    <span class="truncate max-w-md">{{ source.path }}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                 <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        v-model="searchQuery"
                        type="text" 
                        placeholder="Filter files..." 
                        class="pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-md focus:ring-1 focus:ring-blue-500 w-64"
                    />
                </div>
                <button @click="refresh" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Refresh">
                    <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-auto p-6">
            <div v-if="loading && documents.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500">
                <RefreshCw class="w-8 h-8 animate-spin mb-3" />
                <p>Loading files...</p>
            </div>

            <div v-else-if="error" class="flex flex-col items-center justify-center h-full text-red-500">
                <p>{{ error }}</p>
                <button @click="loadDocuments" class="mt-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">Retry</button>
            </div>

            <div v-else-if="filteredDocuments.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No files found.</p>
            </div>

            <div v-else class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th class="px-4 py-3 font-medium">Name</th>
                            <th class="px-4 py-3 font-medium w-32">Type</th>
                            <th class="px-4 py-3 font-medium w-32">Size</th>
                            <th class="px-4 py-3 font-medium w-40">Modified</th>
                            <th class="px-4 py-3 font-medium w-24 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        <tr v-for="doc in filteredDocuments" :key="doc.id" class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2 cursor-pointer" @click="handleOpenFile(doc)">
                                    <component :is="getFileIcon(doc.type)" class="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    <span class="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ doc.name }}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-gray-500 bg-gray-500/10 px-2 py-1 rounded text-xs w-fit">{{ doc.type }}</td>
                            <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ formatSize(doc.sizeBytes) }}</td>
                            <td class="px-4 py-3 text-gray-500">{{ formatDate(doc.lastModified) }}</td>
                            <td class="px-4 py-3 text-right">
                                <button @click="handleOpen(doc)" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all" title="Show in Folder">
                                    <FolderOpen class="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
