import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as sourcesService from '../services/sources.service';
import type { Source, AddSourceOptions, IndexStatus } from '../services/sources.service';

export const useSourcesStore = defineStore('sources', () => {
    // State
    const sources = ref<Source[]>([]);
    const selectedSourceId = ref<string | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const isGlobalPaused = ref(false);
    const addDialogOpen = ref(false);
    const indexStatuses = ref<Map<string, IndexStatus>>(new Map());

    // Getters
    const selectedSource = computed(() =>
        sources.value.find(s => s.id === selectedSourceId.value) || null
    );

    const indexingSources = computed(() =>
        sources.value.filter(s => s.status === 'indexing')
    );

    const totalIndexingProgress = computed(() => {
        const indexing = indexingSources.value;
        if (indexing.length === 0) return 0;

        const total = indexing.reduce((sum, s) => sum + s.totalFiles, 0);
        const indexed = indexing.reduce((sum, s) => sum + s.indexedFiles, 0);
        return total > 0 ? Math.round((indexed / total) * 100) : 0;
    });

    const hasErrors = computed(() =>
        sources.value.some(s => s.status === 'error' || s.errors.length > 0)
    );

    // Actions
    async function fetchSources() {
        loading.value = true;
        error.value = null;
        try {
            sources.value = await sourcesService.listSources();
            isGlobalPaused.value = sourcesService.isGlobalPaused();

            // Auto-select first source if none selected
            if (!selectedSourceId.value && sources.value.length > 0) {
                selectedSourceId.value = sources.value[0].id;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to load sources';
        } finally {
            loading.value = false;
        }
    }

    async function addSource(path: string, options: AddSourceOptions) {
        console.log('[SourcesStore] addSource called with path:', path);
        loading.value = true;
        error.value = null;
        try {
            console.log('[SourcesStore] Calling sourcesService.addSource...');
            const newSource = await sourcesService.addSource(path, options);
            console.log('[SourcesStore] Source added, result:', newSource);
            sources.value.push(newSource);
            selectedSourceId.value = newSource.id;
            addDialogOpen.value = false;
            console.log('[SourcesStore] Dialog should be closed now, addDialogOpen:', addDialogOpen.value);
        } catch (err: any) {
            console.error('[SourcesStore] Error adding source:', err);
            error.value = err.message || 'Failed to add source';
            throw err; // Re-throw so component can handle it
        } finally {
            loading.value = false;
        }
    }

    async function removeSource(sourceId: string) {
        loading.value = true;
        try {
            await sourcesService.removeSource(sourceId);
            sources.value = sources.value.filter(s => s.id !== sourceId);

            // Select another source if current was removed
            if (selectedSourceId.value === sourceId) {
                selectedSourceId.value = sources.value.length > 0 ? sources.value[0].id : null;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to remove source';
        } finally {
            loading.value = false;
        }
    }

    async function reindexSource(sourceId: string) {
        try {
            await sourcesService.reindexSource(sourceId);
            const source = sources.value.find(s => s.id === sourceId);
            if (source) {
                source.status = 'indexing';
                source.indexedFiles = 0;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to reindex source';
        }
    }

    async function reindexAll() {
        loading.value = true;
        try {
            await sourcesService.reindexAllSources();
            sources.value.forEach(s => {
                if (s.status !== 'paused') {
                    s.status = 'indexing';
                    s.indexedFiles = 0;
                }
            });
        } catch (err: any) {
            error.value = err.message || 'Failed to reindex all sources';
        } finally {
            loading.value = false;
        }
    }

    async function clearIndex(sourceId: string) {
        try {
            await sourcesService.clearSourceIndex(sourceId);
            const source = sources.value.find(s => s.id === sourceId);
            if (source) {
                source.indexedFiles = 0;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to clear index';
        }
    }

    async function pauseSource(sourceId: string) {
        try {
            await sourcesService.pauseSourceIndexing(sourceId);
            const source = sources.value.find(s => s.id === sourceId);
            if (source) {
                source.status = 'paused';
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to pause source';
        }
    }

    async function resumeSource(sourceId: string) {
        try {
            await sourcesService.resumeSourceIndexing(sourceId);
            const source = sources.value.find(s => s.id === sourceId);
            if (source) {
                source.status = 'indexing';
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to resume source';
        }
    }

    async function pauseGlobal() {
        try {
            await sourcesService.pauseGlobalIndexing();
            isGlobalPaused.value = true;
            sources.value.forEach(s => {
                if (s.status === 'indexing') {
                    s.status = 'paused';
                }
            });
        } catch (err: any) {
            error.value = err.message || 'Failed to pause indexing';
        }
    }

    async function resumeGlobal() {
        try {
            await sourcesService.resumeGlobalIndexing();
            isGlobalPaused.value = false;
            sources.value.forEach(s => {
                if (s.status === 'paused') {
                    s.status = 'indexing';
                }
            });
        } catch (err: any) {
            error.value = err.message || 'Failed to resume indexing';
        }
    }

    async function retryFailed(sourceId: string) {
        try {
            await sourcesService.retryFailedFiles(sourceId);
            const source = sources.value.find(s => s.id === sourceId);
            if (source) {
                source.errors = [];
                source.failedFiles = 0;
                source.status = 'indexing';
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to retry files';
        }
    }

    async function ignoreFile(sourceId: string, filePath: string) {
        try {
            await sourcesService.ignoreFailedFile(sourceId, filePath);
            const source = sources.value.find(s => s.id === sourceId);
            if (source) {
                source.errors = source.errors.filter(e => e.file !== filePath);
                source.failedFiles = source.errors.length;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to ignore file';
        }
    }

    function selectSource(sourceId: string) {
        selectedSourceId.value = sourceId;
    }

    function openAddDialog() {
        addDialogOpen.value = true;
    }

    function closeAddDialog() {
        addDialogOpen.value = false;
    }

    return {
        // State
        sources,
        selectedSourceId,
        loading,
        error,
        isGlobalPaused,
        addDialogOpen,
        indexStatuses,

        // Getters
        selectedSource,
        indexingSources,
        totalIndexingProgress,
        hasErrors,

        // Actions
        fetchSources,
        addSource,
        removeSource,
        reindexSource,
        reindexAll,
        clearIndex,
        pauseSource,
        resumeSource,
        pauseGlobal,
        resumeGlobal,
        retryFailed,
        ignoreFile,
        selectSource,
        openAddDialog,
        closeAddDialog
    };
});
