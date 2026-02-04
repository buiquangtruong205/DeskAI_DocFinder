import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as favoritesService from '../services/favorites.service';
import type {
    Favorite,
    FavoriteFolder,
    FavoriteKind,
    FavoriteFilters,
    FavoriteSort,
    AddFavoritePayload,
    UpdateFavoritePayload,
    DocumentRef,
    SnippetRef,
    AnswerRef
} from '../services/favorites.service';

// Re-export types for convenience
export type { Favorite, FavoriteFolder, FavoriteKind, DocumentRef, SnippetRef, AnswerRef };

export type CollectionType = 'all' | 'pinned' | 'recent' | string; // string for folder IDs

export const useFavoritesStore = defineStore('favorites', () => {
    // ========== State ==========
    const favorites = ref<Favorite[]>([]);
    const folders = ref<FavoriteFolder[]>([]);
    const tags = ref<string[]>([]);
    const tagCounts = ref<Record<string, number>>({});

    const selectedId = ref<string | null>(null);
    const activeCollection = ref<CollectionType>('all');
    const filterType = ref<FavoriteKind | 'all'>('all');
    const sortBy = ref<FavoriteSort>('recent');
    const searchQuery = ref('');

    const loading = ref(false);
    const error = ref<string | null>(null);

    // ========== Getters ==========
    const selectedItem = computed(() =>
        favorites.value.find(f => f.id === selectedId.value) || null
    );

    const filteredFavorites = computed(() => {
        let results = [...favorites.value];

        // Apply collection filter
        if (activeCollection.value === 'pinned') {
            results = results.filter(f => f.pinned);
        } else if (activeCollection.value === 'recent') {
            // Recent = last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            results = results.filter(f => new Date(f.createdAt) >= weekAgo);
        }
        // For folder IDs, we'd need folder support in the data model

        // Apply type filter
        if (filterType.value !== 'all') {
            results = results.filter(f => f.kind === filterType.value);
        }

        // Apply search
        if (searchQuery.value.trim()) {
            const query = searchQuery.value.toLowerCase();
            results = results.filter(f =>
                f.title.toLowerCase().includes(query) ||
                f.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        return results;
    });

    const counts = computed(() => ({
        all: favorites.value.length,
        pinned: favorites.value.filter(f => f.pinned).length,
        recent: favorites.value.filter(f => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(f.createdAt) >= weekAgo;
        }).length,
        documents: favorites.value.filter(f => f.kind === 'DOCUMENT').length,
        snippets: favorites.value.filter(f => f.kind === 'SNIPPET').length,
        answers: favorites.value.filter(f => f.kind === 'ANSWER').length,
    }));

    // ========== Actions ==========
    async function loadFavorites() {
        loading.value = true;
        error.value = null;

        try {
            const filters: FavoriteFilters = {};
            if (filterType.value !== 'all') {
                filters.kind = filterType.value;
            }
            if (searchQuery.value.trim()) {
                filters.search = searchQuery.value;
            }

            favorites.value = await favoritesService.listFavorites(filters, sortBy.value);

            // Load tags
            const tagsData = await favoritesService.getTags();
            tags.value = tagsData.tags;
            tagCounts.value = tagsData.counts;

            // Load folders
            folders.value = await favoritesService.listFolders();

        } catch (err: any) {
            console.error('Failed to load favorites:', err);
            error.value = err.message || 'Failed to load favorites';
        } finally {
            loading.value = false;
        }
    }

    function selectItem(item: Favorite | null) {
        selectedId.value = item?.id || null;
    }

    async function addFavorite(payload: AddFavoritePayload): Promise<Favorite | null> {
        try {
            const newFavorite = await favoritesService.addFavorite(payload);
            favorites.value.unshift(newFavorite);
            return newFavorite;
        } catch (err: any) {
            console.error('Failed to add favorite:', err);
            error.value = err.message;
            return null;
        }
    }

    async function removeFavorite(id: string): Promise<boolean> {
        try {
            await favoritesService.removeFavorite(id);
            favorites.value = favorites.value.filter(f => f.id !== id);
            if (selectedId.value === id) {
                selectedId.value = null;
            }
            return true;
        } catch (err: any) {
            console.error('Failed to remove favorite:', err);
            error.value = err.message;
            return false;
        }
    }

    async function updateFavorite(id: string, patch: UpdateFavoritePayload): Promise<Favorite | null> {
        try {
            const updated = await favoritesService.updateFavorite(id, patch);
            const index = favorites.value.findIndex(f => f.id === id);
            if (index !== -1) {
                favorites.value[index] = updated;
            }
            return updated;
        } catch (err: any) {
            console.error('Failed to update favorite:', err);
            error.value = err.message;
            return null;
        }
    }

    async function togglePin(id: string): Promise<boolean> {
        const fav = favorites.value.find(f => f.id === id);
        if (!fav) return false;

        const result = await updateFavorite(id, { pinned: !fav.pinned });
        return result !== null;
    }

    async function openFavorite(id: string): Promise<void> {
        try {
            await favoritesService.openFavorite(id);
            // Update usage count locally
            const fav = favorites.value.find(f => f.id === id);
            if (fav) {
                fav.usedCount++;
            }
        } catch (err: any) {
            console.error('Failed to open favorite:', err);
            error.value = err.message;
        }
    }

    function setActiveCollection(collection: CollectionType) {
        activeCollection.value = collection;
    }

    function setFilterType(type: FavoriteKind | 'all') {
        filterType.value = type;
    }

    function setSortBy(sort: FavoriteSort) {
        sortBy.value = sort;
        loadFavorites(); // Reload with new sort
    }

    function setSearchQuery(query: string) {
        searchQuery.value = query;
    }

    async function createFolder(name: string): Promise<FavoriteFolder | null> {
        try {
            const folder = await favoritesService.createFolder(name);
            folders.value.push(folder);
            return folder;
        } catch (err: any) {
            console.error('Failed to create folder:', err);
            error.value = err.message;
            return null;
        }
    }

    async function deleteFolder(id: string): Promise<boolean> {
        try {
            await favoritesService.deleteFolder(id);
            folders.value = folders.value.filter(f => f.id !== id);
            return true;
        } catch (err: any) {
            console.error('Failed to delete folder:', err);
            error.value = err.message;
            return false;
        }
    }

    function clearError() {
        error.value = null;
    }

    return {
        // State
        favorites,
        folders,
        tags,
        tagCounts,
        selectedId,
        activeCollection,
        filterType,
        sortBy,
        searchQuery,
        loading,
        error,
        // Getters
        selectedItem,
        filteredFavorites,
        counts,
        // Actions
        loadFavorites,
        selectItem,
        addFavorite,
        removeFavorite,
        updateFavorite,
        togglePin,
        openFavorite,
        setActiveCollection,
        setFilterType,
        setSortBy,
        setSearchQuery,
        createFolder,
        deleteFolder,
        clearError,
    };
});
