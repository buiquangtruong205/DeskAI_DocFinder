import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as documentsService from '../services/documents.service';
import type { Document, FolderNode, DocumentFilters, DocumentSort } from '../services/documents.service';

export const useDocumentsStore = defineStore('documents', () => {
    // State
    const documents = ref<Document[]>([]);
    const folderTree = ref<FolderNode[]>([]);
    const selectedDocumentId = ref<string | null>(null);
    const selectedFolderId = ref<string>('all');
    const searchQuery = ref('');
    const sortBy = ref<'name' | 'lastIndexed' | 'lastModified' | 'size'>('lastIndexed');
    const sortOrder = ref<'asc' | 'desc'>('desc');
    const viewMode = ref<'list' | 'grid'>('list');
    const selectedDocumentIds = ref<string[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const filterType = ref<'all' | 'favorites' | 'failed' | 'recent'>('all');
    const previewLoading = ref(false);

    // Getters
    const selectedDocument = computed(() =>
        documents.value.find(d => d.id === selectedDocumentId.value) || null
    );

    const filteredDocuments = computed(() => documents.value);

    const hasSelection = computed(() => selectedDocumentIds.value.length > 0);

    const selectionCount = computed(() => selectedDocumentIds.value.length);

    const totalDocuments = computed(() => documents.value.length);

    const favoriteCount = computed(() =>
        documents.value.filter(d => d.isFavorite).length
    );

    const errorCount = computed(() =>
        documents.value.filter(d => d.status === 'error').length
    );

    // Actions
    async function fetchDocuments() {
        loading.value = true;
        error.value = null;
        try {
            const filters: DocumentFilters = {
                folderId: selectedFolderId.value,
                searchQuery: searchQuery.value,
                filterType: filterType.value
            };
            const sort: DocumentSort = {
                key: sortBy.value,
                order: sortOrder.value
            };
            documents.value = await documentsService.listDocuments(filters, sort);
        } catch (err: any) {
            error.value = err.message || 'Failed to load documents';
        } finally {
            loading.value = false;
        }
    }

    async function fetchFolderTree() {
        try {
            folderTree.value = await documentsService.getFolderTree();
        } catch (err: any) {
            console.error('Failed to load folder tree:', err);
        }
    }

    function selectDocument(documentId: string | null) {
        selectedDocumentId.value = documentId;
    }

    function selectFolder(folderId: string) {
        selectedFolderId.value = folderId;
        selectedDocumentId.value = null;
        fetchDocuments();
    }

    function setSearchQuery(query: string) {
        searchQuery.value = query;
        fetchDocuments();
    }

    function setFilterType(type: 'all' | 'favorites' | 'failed' | 'recent') {
        filterType.value = type;
        fetchDocuments();
    }

    function setSort(key: 'name' | 'lastIndexed' | 'lastModified' | 'size', order?: 'asc' | 'desc') {
        if (sortBy.value === key && !order) {
            // Toggle order if same key
            sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy.value = key;
            sortOrder.value = order || 'desc';
        }
        fetchDocuments();
    }

    function setViewMode(mode: 'list' | 'grid') {
        viewMode.value = mode;
    }

    function toggleDocumentSelection(documentId: string) {
        const index = selectedDocumentIds.value.indexOf(documentId);
        if (index === -1) {
            selectedDocumentIds.value.push(documentId);
        } else {
            selectedDocumentIds.value.splice(index, 1);
        }
    }

    function selectAllDocuments() {
        selectedDocumentIds.value = documents.value.map(d => d.id);
    }

    function clearSelection() {
        selectedDocumentIds.value = [];
    }

    async function toggleFavorite(documentId: string) {
        try {
            const newState = await documentsService.toggleFavorite(documentId);
            const doc = documents.value.find(d => d.id === documentId);
            if (doc) {
                doc.isFavorite = newState;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to toggle favorite';
        }
    }

    async function updateTags(documentId: string, tags: string[]) {
        try {
            await documentsService.updateDocumentTags(documentId, tags);
            const doc = documents.value.find(d => d.id === documentId);
            if (doc) {
                doc.tags = tags;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to update tags';
        }
    }

    async function reindexDocument(documentId: string) {
        try {
            await documentsService.reindexDocument(documentId);
            const doc = documents.value.find(d => d.id === documentId);
            if (doc) {
                doc.status = 'pending';
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to reindex document';
        }
    }

    async function removeDocument(documentId: string) {
        try {
            await documentsService.removeDocument(documentId);
            documents.value = documents.value.filter(d => d.id !== documentId);
            if (selectedDocumentId.value === documentId) {
                selectedDocumentId.value = null;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to remove document';
        }
    }

    async function openDocument(filePath: string) {
        try {
            await documentsService.openDocument(filePath);
        } catch (err: any) {
            error.value = err.message || 'Failed to open document';
        }
    }

    async function revealInExplorer(filePath: string) {
        try {
            await documentsService.revealInExplorer(filePath);
        } catch (err: any) {
            error.value = err.message || 'Failed to reveal in explorer';
        }
    }

    async function bulkReindex() {
        try {
            await documentsService.bulkReindex(selectedDocumentIds.value);
            documents.value.forEach(doc => {
                if (selectedDocumentIds.value.includes(doc.id)) {
                    doc.status = 'pending';
                }
            });
            clearSelection();
        } catch (err: any) {
            error.value = err.message || 'Failed to bulk reindex';
        }
    }

    async function bulkRemove() {
        try {
            await documentsService.bulkRemove(selectedDocumentIds.value);
            documents.value = documents.value.filter(d => !selectedDocumentIds.value.includes(d.id));
            clearSelection();
        } catch (err: any) {
            error.value = err.message || 'Failed to bulk remove';
        }
    }

    async function bulkAddTags(tags: string[]) {
        try {
            await documentsService.bulkAddTags(selectedDocumentIds.value, tags);
            documents.value.forEach(doc => {
                if (selectedDocumentIds.value.includes(doc.id)) {
                    const uniqueTags = [...new Set([...doc.tags, ...tags])];
                    doc.tags = uniqueTags;
                }
            });
            clearSelection();
        } catch (err: any) {
            error.value = err.message || 'Failed to bulk add tags';
        }
    }

    return {
        // State
        documents,
        folderTree,
        selectedDocumentId,
        selectedFolderId,
        searchQuery,
        sortBy,
        sortOrder,
        viewMode,
        selectedDocumentIds,
        loading,
        error,
        filterType,
        previewLoading,

        // Getters
        selectedDocument,
        filteredDocuments,
        hasSelection,
        selectionCount,
        totalDocuments,
        favoriteCount,
        errorCount,

        // Actions
        fetchDocuments,
        fetchFolderTree,
        selectDocument,
        selectFolder,
        setSearchQuery,
        setFilterType,
        setSort,
        setViewMode,
        toggleDocumentSelection,
        selectAllDocuments,
        clearSelection,
        toggleFavorite,
        updateTags,
        reindexDocument,
        removeDocument,
        openDocument,
        revealInExplorer,
        bulkReindex,
        bulkRemove,
        bulkAddTags
    };
});
