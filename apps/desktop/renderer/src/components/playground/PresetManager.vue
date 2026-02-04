<script setup lang="ts">
import { usePlaygroundStore } from '../../stores/playground.store';
import { ref, onMounted } from 'vue';

const store = usePlaygroundStore();
const showDropdown = ref(false);
const newPresetName = ref('');
const isSaving = ref(false);

onMounted(() => {
    store.fetchPresets();
});

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
    if (!showDropdown.value) {
        isSaving.value = false;
        newPresetName.value = '';
    }
};

const loadPreset = (id: string) => {
    store.loadPreset(id);
    showDropdown.value = false;
};

const deletePreset = async (id: string) => {
    if (confirm('Delete this preset?')) {
        await store.removePreset(id);
    }
};

const handleSave = async () => {
    if (!newPresetName.value.trim()) return;
    await store.saveCurrentAsPreset(newPresetName.value);
    isSaving.value = false;
    newPresetName.value = '';
    showDropdown.value = false;
};
</script>

<template>
    <div class="relative">
        <button 
            @click="toggleDropdown"
            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
            <span>💾 Presets</span>
            <span class="text-xs opacity-50">▼</span>
        </button>

        <!-- Dropdown -->
        <div v-if="showDropdown" class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden transform origin-top-right">
            
            <!-- Save New -->
            <div class="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div v-if="!isSaving">
                     <button 
                        @click="isSaving = true"
                        class="w-full text-center py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md border border-dashed border-blue-200 dark:border-blue-800"
                    >
                        + Save Current State
                    </button>
                </div>
                <div v-else class="space-y-2">
                    <input 
                        v-model="newPresetName"
                        type="text" 
                        placeholder="Preset Name"
                        class="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @keyup.enter="handleSave"
                        autoFocus
                    >
                    <div class="flex gap-2">
                        <button 
                            @click="handleSave"
                            class="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save
                        </button>
                        <button 
                            @click="isSaving = false"
                            class="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <!-- List -->
            <div class="max-h-64 overflow-y-auto">
                <div v-if="store.presets.length === 0" class="p-4 text-center text-xs text-gray-400 italic">
                    No presets saved.
                </div>
                <div v-else>
                    <div 
                        v-for="preset in store.presets" 
                        :key="preset.id"
                        class="group flex items-center justify-between p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                        @click="loadPreset(preset.id)"
                    >
                        <div class="min-w-0">
                            <div class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ preset.name }}</div>
                            <div class="text-[10px] text-gray-400">
                                {{ new Date(preset.createdAt).toLocaleDateString() }}
                            </div>
                        </div>
                        <button 
                            @click.stop="deletePreset(preset.id)"
                            class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded transition-all"
                            title="Delete Preset"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Backdrop -->
        <div v-if="showDropdown" @click="toggleDropdown" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>
    </div>
</template>
