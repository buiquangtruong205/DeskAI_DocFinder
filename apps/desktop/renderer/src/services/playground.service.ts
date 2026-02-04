import { invoke } from './desktopApi';

export interface PlaygroundRequest {
    prompt: {
        system: string;
        user: string;
    };
    context: {
        collections: string[];
        files: string[];
        useSemanticRetrieval: boolean;
        useKeywordRetrieval: boolean;
    };
    retrieval: {
        topK: number;
        scoreThreshold: number;
        hybridWeight: number; // 0 = keyword only, 1 = semantic only
    };
    generation: {
        model: string;
        temperature: number;
        maxTokens: number;
        answerStyle: 'concise' | 'detailed' | 'bullet_points';
    };
}

export interface RetrievedChunk {
    id: string;
    fileName: string;
    filePath: string;
    content: string;
    score: number;
    highlightRanges?: { start: number; end: number }[];
}

export interface PlaygroundResponse {
    answer: string;
    retrievedChunks: RetrievedChunk[];
    debug: {
        retrievalTimeMs: number;
        generationTimeMs: number;
        tokenUsage: {
            prompt: number;
            completion: number;
            total: number;
        };
        modelName: string;
        finalPrompt: string;
    };
}

export interface PlaygroundPreset {
    id: string;
    name: string;
    config: {
        prompt: { system: string; user: string };
        context: {
            collections: string[];
            files: string[];
            useSemanticRetrieval: boolean;
            useKeywordRetrieval: boolean;
        };
        retrieval: {
            topK: number;
            scoreThreshold: number;
            hybridWeight: number;
        };
        generation: {
            model: string;
            temperature: number;
            maxTokens: number;
            answerStyle: 'concise' | 'detailed' | 'bullet_points';
        };
    };
    createdAt: number;
}

// IPC Wrapper
export async function runPlayground(request: PlaygroundRequest): Promise<PlaygroundResponse> {
    return await invoke('playground:run', request);
}

// Preset Management (Local Storage for now)
const PRESETS_KEY = 'deskai_playground_presets';

export async function loadPresets(): Promise<PlaygroundPreset[]> {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function savePreset(preset: PlaygroundPreset): Promise<void> {
    const presets = await loadPresets();
    const index = presets.findIndex(p => p.id === preset.id);
    if (index >= 0) {
        presets[index] = preset;
    } else {
        presets.push(preset);
    }
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export async function deletePreset(presetId: string): Promise<void> {
    const presets = await loadPresets();
    const filtered = presets.filter(p => p.id !== presetId);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(filtered));
}
