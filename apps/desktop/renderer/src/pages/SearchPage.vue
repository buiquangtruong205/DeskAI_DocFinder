<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchStore } from '../stores/search.store';
import { useSourcesStore } from '../stores/sources.store';
import SearchInput from '../components/search/SearchInput.vue';
import FilterPanel from '../components/search/FilterPanel.vue';
import ResultList from '../components/search/ResultList.vue';
import SearchToolbar from '../components/search/SearchToolbar.vue';
import PreviewPane from '../components/search/PreviewPane.vue';
import StatusFooter from '../components/search/StatusFooter.vue';
import { openFile, addFavorite, sendToAsk } from '../services/search.service';
import { selectFolder } from '../services/sources.service';

const router = useRouter();
const store = useSearchStore();
const sourcesStore = useSourcesStore();

// Resizable Split Logic
const leftWidth = ref(40); // Percentage
const isDragging = ref(false);

const startDrag = () => {
    isDragging.value = true;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onDrag = (e: MouseEvent) => {
    if (isDragging.value) {
        const containerWidth = document.body.clientWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        // Clamp between 20% and 70%
        if (newLeftWidth > 20 && newLeftWidth < 70) {
            leftWidth.value = newLeftWidth;
        }
    }
};

const stopDrag = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

// Open folder picker dialog to add a new source
const handleOpenFolder = async () => {
    const folderPath = await selectFolder();
    if (folderPath) {
        // Add folder as source with default options
        await sourcesStore.addSource(folderPath, {
            includeTypes: ['.md', '.txt', '.pdf', '.py', '.js', '.ts', '.json'],
            excludePatterns: ['node_modules', '.git', '__pycache__', 'dist', 'build']
        });
        console.log('Added folder as source:', folderPath);
    }
};

// Handlers for emit events that aren't state-based
const handleOpen = async (item?: any) => {
    const target = item || store.selectedItem;
    console.log('[SearchPage] handleOpen called. Target:', target);
    console.log('[SearchPage] Store Data - SelectedID:', store.selectedId, 'Results Count:', store.results.length);
    if (store.results.length > 0) {
        console.log('[SearchPage] First Result in Store:', store.results[0]);
    }
    if (target) {
        if (target.sourceId) {
            console.log('[SearchPage] Navigating to source details:', target.sourceId);
            router.push({ name: 'source-details', params: { id: target.sourceId } })
                .catch(err => console.error('[SearchPage] Navigation failed:', err));
        } else {
            console.log('[SearchPage] Opening file directly:', target.path);
            await openFile(target.path);
        }
    } else {
        console.warn('[SearchPage] handleOpen called but no target selected');
        // Fallback: If a specific source is selected in filters, open that source
        if (store.filters.source && store.filters.source !== 'all') {
             console.log('[SearchPage] No result selected, but source filter is active. Opening source:', store.filters.source);
             router.push({ name: 'source-details', params: { id: store.filters.source } })
                .catch(err => console.error('[SearchPage] Navigation failed:', err));
        } else {
             // Fallback: Open Sources management page
             console.log('[SearchPage] No selection. Navigating to Sources list.');
             router.push({ name: 'sources' });
        }
    }
};

const handleFavorite = async (item?: any) => {
    const target = item || store.selectedItem;
    if (target) {
        await addFavorite(target);
    }
};

const handleAsk = async (item?: any) => {
    const target = item || store.selectedItem;
    if (target) {
        await sendToAsk(store.query, { file: target.path, content: store.previewContent });
        router.push({ name: 'ask' });
    }
};

const handleCopy = () => {
    if (store.selectedItem && store.previewContent) {
        navigator.clipboard.writeText(store.previewContent);
    }
};

onMounted(() => {
    if (store.results.length === 0) {
        store.performSearch();
    }
});
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans cursor-default select-none overflow-hidden">
        <!-- 1. Search Bar (Fixed Top) -->
        <div class="px-6 py-4 pb-2 bg-white dark:bg-gray-900 z-10 shadow-sm border-b border-gray-200 dark:border-gray-800">
            <div class="w-full space-y-3">
                 <SearchInput />
                 <FilterPanel v-model="store.filters" @reset="store.performSearch" />
            </div>
        </div>

        <!-- 3. Results Area (Split View) -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left: Result List -->
             <div 
                class="flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                :style="{ width: `${leftWidth}%` }"
            >
                <SearchToolbar 
                    @open="() => handleOpen()"
                    @ask="() => handleAsk()"
                    @save="() => handleFavorite()"
                    @copy="handleCopy"
                />
                <div class="flex-1 overflow-hidden relative">
                     <div v-if="store.error" class="p-4 text-red-500 text-center bg-red-50 dark:bg-red-900/20 m-4 rounded-lg">{{ store.error }}</div>
                     <ResultList 
                        :results="store.results" 
                        :selectedId="store.selectedId" 
                        :loading="store.loading"
                        @select="store.selectItem"
                        @open="handleOpen"
                        @favorite="handleFavorite"
                        @ask="handleAsk"
                     />
                </div>
                 <!-- 4. Status Footer (Left Side) -->
                 <StatusFooter 
                    :total="store.results.length" 
                    :time="store.stats?.time" 
                    :mode="store.mode"
                />
            </div>

            <!-- Resizer Handle -->
            <div 
                class="w-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 cursor-col-resize z-20 flex items-center justify-center transition-colors delay-150 hover:delay-0 active:bg-blue-600"
                @mousedown="startDrag"
            >
                <!-- Grip visual -->
                <div class="h-8 w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <!-- Right: Preview Pane -->
            <div class="flex-1 bg-white dark:bg-gray-900 overflow-hidden" style="min-width: 0;">
                <PreviewPane 
                    :item="store.selectedItem" 
                    :previewContent="store.previewContent" 
                    :loading="store.previewLoading"
                    @open="() => handleOpen()"
                    @copy="handleCopy"
                    @ask="() => handleAsk()"
                />
            </div>
        </div>
    </div>
</template>
