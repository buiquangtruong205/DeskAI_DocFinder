import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    type PlaygroundRequest,
    type PlaygroundResponse,
    type PlaygroundPreset,
    runPlayground,
    savePreset as serviceSavePreset,
    loadPresets as serviceLoadPresets,
    deletePreset as serviceDeletePreset
} from '../services/playground.service';

export const usePlaygroundStore = defineStore('playground', () => {
    // --- State ---

    // Prompt
    const prompt = ref({
        system: '',
        user: ''
    });

    // Context
    const context = ref({
        // Default to empty/all for now, typically populated from sources store
        collections: [] as string[],
        files: [] as string[],
        useSemanticRetrieval: true,
        useKeywordRetrieval: true
    });

    // Retrieval Parameters
    const retrieval = ref({
        topK: 3,
        scoreThreshold: 0.5,
        hybridWeight: 0.7 // Default favoring semantic
    });

    // Generation Parameters
    const generation = ref({
        model: 'gpt-4o', // Default model
        temperature: 0.7,
        maxTokens: 512,
        answerStyle: 'detailed' as 'concise' | 'detailed' | 'bullet_points'
    });

    // Result State
    const result = ref<PlaygroundResponse | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Presets
    const presets = ref<PlaygroundPreset[]>([]);

    // --- Actions ---

    const runQuery = async () => {
        if (!prompt.value.user.trim()) return;

        loading.value = true;
        error.value = null;
        result.value = null;

        const request: PlaygroundRequest = {
            prompt: { ...prompt.value },
            context: { ...context.value },
            retrieval: { ...retrieval.value },
            generation: { ...generation.value }
        };

        try {
            result.value = await runPlayground(request);
        } catch (err: any) {
            console.error('Playground run failed:', err);
            error.value = err.message || 'Failed to run playground query';
        } finally {
            loading.value = false;
        }
    };

    const resetState = () => {
        prompt.value = { system: '', user: '' };
        context.value = { collections: [], files: [], useSemanticRetrieval: true, useKeywordRetrieval: true };
        retrieval.value = { topK: 3, scoreThreshold: 0.5, hybridWeight: 0.7 };
        generation.value = { model: 'gpt-4o', temperature: 0.7, maxTokens: 512, answerStyle: 'detailed' };
        result.value = null;
        error.value = null;
    };

    // Preset Actions
    const fetchPresets = async () => {
        presets.value = await serviceLoadPresets();
    };

    const saveCurrentAsPreset = async (name: string) => {
        const newPreset: PlaygroundPreset = {
            id: Date.now().toString(),
            name,
            config: {
                prompt: { ...prompt.value },
                context: { ...context.value },
                retrieval: { ...retrieval.value },
                generation: { ...generation.value }
            },
            createdAt: Date.now()
        };
        await serviceSavePreset(newPreset);
        await fetchPresets();
    };

    const loadPreset = (presetId: string) => {
        const target = presets.value.find(p => p.id === presetId);
        if (target) {
            prompt.value = { ...target.config.prompt };
            context.value = { ...target.config.context };
            retrieval.value = { ...target.config.retrieval };
            generation.value = { ...target.config.generation };
            // Clear previous results on fresh load
            result.value = null;
        }
    };

    const removePreset = async (presetId: string) => {
        await serviceDeletePreset(presetId);
        await fetchPresets();
    };

    return {
        // State
        prompt,
        context,
        retrieval,
        generation,
        result,
        loading,
        error,
        presets,

        // Actions
        runQuery,
        resetState,
        fetchPresets,
        saveCurrentAsPreset,
        loadPreset,
        removePreset
    };
});
