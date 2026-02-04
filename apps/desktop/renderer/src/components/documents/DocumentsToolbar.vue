<script setup lang="ts">
import { ref } from 'vue';
import { useDocumentsStore } from '../../stores/documents.store';

const store = useDocumentsStore();
const showTagInput = ref(false);
const newTag = ref('');

const handleBulkReindex = () => {
    if (confirm(`Re-index ${store.selectionCount} documents?`)) {
        store.bulkReindex();
    }
};

const handleBulkRemove = () => {
    if (confirm(`Remove ${store.selectionCount} documents from index?`)) {
        store.bulkRemove();
    }
};

const handleAddTag = () => {
    if (newTag.value.trim()) {
        store.bulkAddTags([newTag.value.trim()]);
        newTag.value = '';
        showTagInput.value = false;
    }
};
</script>

<template>
    <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
    >
        <div
            v-if="store.hasSelection"
            class="flex items-center gap-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
        >
            <!-- Selection Count -->
            <div class="flex items-center gap-2">
                <span class="text-blue-600 dark:text-blue-400 font-medium">
                    {{ store.selectionCount }} selected
                </span>
                <button
                    @click="store.clearSelection()"
                    class="text-sm text-blue-500 hover:text-blue-700 underline"
                >
                    Clear
                </button>
            </div>

            <!-- Divider -->
            <div class="h-5 w-px bg-blue-200 dark:bg-blue-700"></div>

            <!-- Bulk Actions -->
            <div class="flex items-center gap-2">
                <!-- Re-index -->
                <button
                    @click="handleBulkReindex"
                    class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                    <span>🔄</span>
                    Re-index
                </button>

                <!-- Add Tag -->
                <div class="relative">
                    <button
                        @click="showTagInput = !showTagInput"
                        class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        <span>🏷️</span>
                        Add tag
                    </button>

                    <!-- Tag Input Dropdown -->
                    <div
                        v-if="showTagInput"
                        class="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50"
                    >
                        <div class="flex gap-2">
                            <input
                                v-model="newTag"
                                @keyup.enter="handleAddTag"
                                type="text"
                                placeholder="Tag name..."
                                class="w-32 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autofocus
                            />
                            <button
                                @click="handleAddTag"
                                class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Remove -->
                <button
                    @click="handleBulkRemove"
                    class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                    <span>🗑️</span>
                    Remove
                </button>
            </div>

            <!-- Select All -->
            <button
                @click="store.selectAllDocuments()"
                class="ml-auto text-sm text-blue-500 hover:text-blue-700 font-medium"
            >
                Select all
            </button>
        </div>
    </Transition>

    <!-- Click outside to close tag input -->
    <div
        v-if="showTagInput"
        class="fixed inset-0 z-40"
        @click="showTagInput = false"
    ></div>
</template>
