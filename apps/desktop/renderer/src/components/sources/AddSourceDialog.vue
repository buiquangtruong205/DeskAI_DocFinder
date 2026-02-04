<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import { useSourcesStore } from '../../stores/sources.store';
import type { AddSourceOptions } from '../../services/sources.service';
import { selectFolder } from '../../services/sources.service';

const store = useSourcesStore();

// Step management
const currentStep = ref(1);

// Form data
const selectedPath = ref('');
const customName = ref('');
const includeTypes = ref<string[]>(['.md', '.txt', '.pdf', '.py', '.js', '.ts', '.json']);
const excludePatterns = ref<string[]>(['node_modules', '.git', '__pycache__', 'dist', 'build']);
const customExclude = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const availableTypes = [
    { ext: '.md', label: 'Markdown', icon: '📝' },
    { ext: '.txt', label: 'Text', icon: '📄' },
    { ext: '.pdf', label: 'PDF', icon: '📕' },
    { ext: '.py', label: 'Python', icon: '🐍' },
    { ext: '.js', label: 'JavaScript', icon: '⚡' },
    { ext: '.ts', label: 'TypeScript', icon: '💎' },
    { ext: '.json', label: 'JSON', icon: '🔧' },
    { ext: '.csv', label: 'CSV', icon: '📊' },
    { ext: '.xml', label: 'XML', icon: '📋' },
    { ext: '.html', label: 'HTML', icon: '🌐' },
    { ext: '.docx', label: 'Word', icon: '📘' },
];

const defaultExcludes = ['node_modules', '.git', '__pycache__', 'dist', 'build', '.venv', 'vendor'];

// Computed
const canProceed = computed(() => {
    if (currentStep.value === 1) return selectedPath.value.length > 0 && customName.value.trim().length > 0;
    if (currentStep.value === 2) return includeTypes.value.length > 0;
    return true;
});

const estimatedFiles = computed(() => {
    // Mock estimation
    return Math.floor(Math.random() * 100) + 20;
});

const folderName = computed(() => {
    return customName.value.trim() || selectedPath.value.split('/').pop() || selectedPath.value.split('\\').pop() || 'Selected Folder';
});

// Methods
const handleSelectFolder = async () => {
    console.log('[AddSourceDialog] Opening folder dialog...');
    try {
        const path = await selectFolder();
        console.log('[AddSourceDialog] Selected path:', path);
        if (path) {
            selectedPath.value = path;
            // Set default name from folder basename
            const defaultName = path.split('/').pop() || path.split('\\').pop() || 'New Source';
            customName.value = defaultName;
        }
    } catch (error) {
        console.error('[AddSourceDialog] Error selecting folder:', error);
    }
};

const toggleType = (ext: string) => {
    const index = includeTypes.value.indexOf(ext);
    if (index > -1) {
        includeTypes.value.splice(index, 1);
    } else {
        includeTypes.value.push(ext);
    }
};

const toggleExclude = (pattern: string) => {
    const index = excludePatterns.value.indexOf(pattern);
    if (index > -1) {
        excludePatterns.value.splice(index, 1);
    } else {
        excludePatterns.value.push(pattern);
    }
};

const addCustomExclude = () => {
    if (customExclude.value.trim() && !excludePatterns.value.includes(customExclude.value.trim())) {
        excludePatterns.value.push(customExclude.value.trim());
        customExclude.value = '';
    }
};

const nextStep = () => {
    if (currentStep.value < 3) {
        currentStep.value++;
    }
};

const prevStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--;
    }
};

const handleConfirm = async () => {
    if (isSubmitting.value) return;
    
    console.log('[AddSourceDialog] Confirming add source...');
    console.log('[AddSourceDialog] Path:', selectedPath.value);
    
    errorMessage.value = '';
    isSubmitting.value = true;
    
    // Convert Vue reactive Proxy arrays to plain arrays for IPC serialization
    const options: AddSourceOptions = {
        name: customName.value.trim(),
        includeTypes: [...toRaw(includeTypes.value)],
        excludePatterns: [...toRaw(excludePatterns.value)],
    };
    
    try {
        await store.addSource(selectedPath.value, options);
        console.log('[AddSourceDialog] Source added successfully');
        resetForm();
    } catch (error: any) {
        console.error('[AddSourceDialog] Error adding source:', error);
        // Extract user-friendly error message
        const msg = error?.message || 'Failed to add source';
        if (msg.includes('already exists')) {
            errorMessage.value = 'This folder has already been added as a source.';
        } else {
            errorMessage.value = msg;
        }
    } finally {
        isSubmitting.value = false;
    }
};

const handleCancel = () => {
    store.closeAddDialog();
    resetForm();
};

const resetForm = () => {
    currentStep.value = 1;
    selectedPath.value = '';
    customName.value = '';
    includeTypes.value = ['.md', '.txt', '.pdf', '.py', '.js', '.ts', '.json'];
    excludePatterns.value = ['node_modules', '.git', '__pycache__', 'dist', 'build'];
    customExclude.value = '';
    errorMessage.value = '';
    isSubmitting.value = false;
};
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="store.addDialogOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div 
                    class="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    @click="handleCancel"
                ></div>

                <!-- Dialog -->
                <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                Add New Source
                            </h2>
                            <button 
                                @click="handleCancel"
                                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <!-- Step Indicator -->
                        <div class="flex items-center gap-2 mt-4">
                            <div 
                                v-for="step in 3" 
                                :key="step"
                                class="flex-1 h-1.5 rounded-full transition-colors"
                                :class="step <= currentStep ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'"
                            ></div>
                        </div>
                        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span :class="{ 'text-blue-500 font-medium': currentStep === 1 }">Choose Source</span>
                            <span :class="{ 'text-blue-500 font-medium': currentStep === 2 }">Options</span>
                            <span :class="{ 'text-blue-500 font-medium': currentStep === 3 }">Confirm</span>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
                        <!-- Step 1: Choose Source -->
                        <div v-if="currentStep === 1">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Choose source type
                            </h3>
                            
                            <!-- Folder Option -->
                            <button 
                                @click="handleSelectFolder"
                                class="w-full p-4 rounded-xl border-2 transition-all text-left"
                                :class="selectedPath 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                            >
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl">
                                        📁
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-semibold text-gray-900 dark:text-white">Local Folder</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ selectedPath || 'Select a folder from your computer' }}
                                        </div>
                                    </div>
                                    <span v-if="selectedPath" class="text-green-500">✓</span>
                                </div>
                            </button>

                            <!-- Custom Name Input (shown after folder selection) -->
                            <div v-if="selectedPath" class="mt-4">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Source Name
                                </label>
                                <input 
                                    v-model="customName"
                                    type="text"
                                    placeholder="Enter a name for this source..."
                                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    This name will be displayed in the sources list
                                </p>
                            </div>

                            <!-- Future Options (disabled) -->
                            <div class="mt-3 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                                        🌐
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-semibold text-gray-500">Git / Remote</div>
                                        <div class="text-sm text-gray-400">Coming in v2</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Options -->
                        <div v-if="currentStep === 2">
                            <!-- Include File Types -->
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Include file types
                                </h3>
                                <div class="flex flex-wrap gap-2">
                                    <button 
                                        v-for="type in availableTypes" 
                                        :key="type.ext"
                                        @click="toggleType(type.ext)"
                                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                        :class="includeTypes.includes(type.ext) 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                                    >
                                        <span>{{ type.icon }}</span>
                                        {{ type.ext }}
                                    </button>
                                </div>
                            </div>

                            <!-- Exclude Patterns -->
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Exclude patterns
                                </h3>
                                <div class="flex flex-wrap gap-2 mb-3">
                                    <button 
                                        v-for="pattern in defaultExcludes" 
                                        :key="pattern"
                                        @click="toggleExclude(pattern)"
                                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                        :class="excludePatterns.includes(pattern) 
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                                    >
                                        {{ pattern }}
                                    </button>
                                </div>
                                
                                <!-- Custom Exclude Input -->
                                <div class="flex gap-2">
                                    <input 
                                        v-model="customExclude"
                                        @keydown.enter="addCustomExclude"
                                        type="text"
                                        placeholder="Add custom pattern..."
                                        class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button 
                                        @click="addCustomExclude"
                                        class="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Step 3: Confirm -->
                        <div v-if="currentStep === 3">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Confirm & Start Indexing
                            </h3>

                            <!-- Summary Card -->
                            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl">
                                        📁
                                    </div>
                                    <div>
                                        <div class="font-semibold text-gray-900 dark:text-white">{{ folderName }}</div>
                                        <div class="text-xs text-gray-500 truncate max-w-xs">{{ selectedPath }}</div>
                                    </div>
                                </div>

                                <div class="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">File types</span>
                                        <span class="text-gray-900 dark:text-white font-medium">{{ includeTypes.length }} types</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Excluded</span>
                                        <span class="text-gray-900 dark:text-white font-medium">{{ excludePatterns.length }} patterns</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Estimated files</span>
                                        <span class="text-blue-500 font-medium">~{{ estimatedFiles }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Error Message -->
                            <div v-if="errorMessage" class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <span class="text-lg">⚠️</span>
                                    <span class="text-sm font-medium">{{ errorMessage }}</span>
                                </div>
                            </div>

                            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                Files will be scanned, chunked, and embedded for AI search. This may take a few minutes depending on the number of files.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <button 
                            v-if="currentStep > 1"
                            @click="prevStep"
                            class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
                        >
                            Back
                        </button>
                        <div v-else></div>

                        <div class="flex gap-3">
                            <button 
                                @click="handleCancel"
                                class="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            
                            <button 
                                v-if="currentStep < 3"
                                @click="nextStep"
                                :disabled="!canProceed"
                                class="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                            >
                                Next
                            </button>
                            
                            <button 
                                v-else
                                @click="handleConfirm"
                                :disabled="isSubmitting"
                                class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg flex items-center gap-2"
                            >
                                <svg v-if="isSubmitting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {{ isSubmitting ? 'Adding...' : 'Add & Index' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
