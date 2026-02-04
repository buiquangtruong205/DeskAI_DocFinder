import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { search, getPreview, openFile, addFavorite, sendToAsk } from '../services/search.service';
import type { SearchResultItem, SearchStats } from '../services/search.service';

export const useSearchStore = defineStore('search', () => {
    // State
    const query = ref('');
    const mode = ref('hybrid');
    const filters = ref({
        type: 'all',
        source: 'all',
        date: 'all',
    });
    const results = ref<SearchResultItem[]>([]);
    const selectedId = ref<string | undefined>(undefined);
    const previewContent = ref<string>('');
    const loading = ref(false);
    const previewLoading = ref(false);
    const error = ref<string | null>(null);
    const stats = ref<SearchStats | undefined>(undefined);

    // Getters
    const selectedItem = computed(() => results.value.find(r => r.id === selectedId.value));

    // Actions
    async function performSearch() {
        // if (!query.value.trim()) {
        //     results.value = [];
        //     stats.value = undefined;
        //     return;
        // }

        loading.value = true;
        error.value = null;
        selectedId.value = undefined;
        previewContent.value = '';

        try {
            // Unwrap proxy to avoid Data Clone Error
            const plainFilters = JSON.parse(JSON.stringify(filters.value));
            const response = await search(query.value, mode.value, plainFilters);
            console.log('[SearchStore] search API response:', response);
            if (response.results.length > 0) {
                console.log('[SearchStore] First result:', response.results[0]);
            }
            results.value = response.results.map(r => ({
                ...r,
                id: r.id || r.chunkId || r.fileId || Math.random().toString(36).substring(7)
            }));
            if (response.results.length > 0) {
                console.log('[SearchStore] First mapped result:', results.value[0]);
            }
            stats.value = response.stats;

            // Auto-select first result
            if (results.value.length > 0) {
                await selectItem(results.value[0]);
            }
        } catch (err: any) {
            error.value = err.message || 'Search failed';
            console.error(err);
        } finally {
            loading.value = false;
        }
    }

    async function selectItem(item: SearchResultItem) {
        console.log('[SearchStore] Selecting item:', item);
        selectedId.value = item.id;
        previewLoading.value = true;
        try {
            const preview = await getPreview(item.id, item.path);
            previewContent.value = preview.content;
        } catch (err) {
            console.error('Failed to get preview', err);
            previewContent.value = 'Failed to load preview.';
        } finally {
            previewLoading.value = false;
        }
    }

    async function clearSearch() {
        query.value = '';
        results.value = [];
        selectedId.value = undefined;
        previewContent.value = '';
        stats.value = undefined;
        error.value = null;
    }

    function setMode(newMode: string) {
        mode.value = newMode;
        if (query.value) performSearch();
    }

    function setFilters(newFilters: any) {
        filters.value = newFilters;
        if (query.value) performSearch();
    }

    return {
        // State
        query,
        mode,
        filters,
        results,
        selectedId,
        previewContent,
        loading,
        previewLoading,
        error,
        stats,
        // Getters
        selectedItem,
        // Actions
        performSearch,
        selectItem,
        clearSearch,
        setMode,
        setFilters
    };
});
